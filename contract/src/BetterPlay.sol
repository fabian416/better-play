// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * BetterPlay.sol — MVP Parimutuel (1X2 or Binary) using USDC/any ERC-20 stable.
 *
 * Features:
 * - Outcome pools: (Home/Draw/Away) or (Yes/No)
 * - Fee in basis points applied to losing pools
 * - Multisig/Admin proposes the result with a dispute window
 * - Finalizes and pays out pro-rata
 * - Full refund on cancel
 *
 * Safety:
 * - ReentrancyGuard
 * - Pull payments (user claims)
 * - No user-iteration loops (individual claim)
 *
 * Notes:
 * - Token decimals are respected implicitly (no re-scaling). USDC often has 6 decimals.
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function decimals() external view returns (uint8); // optional; many tokens implement it but it's not required here
    function balanceOf(address) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED     = 2;
    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        require(_status == _NOT_ENTERED, "REENTRANCY");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

contract BetterPlay is ReentrancyGuard {
    // --- Types ---
    enum MarketState { Open, Closed, Resolved, Canceled }
    // Outcomes: for 1X2 use [0=Home, 1=Draw, 2=Away]; for binary use [0=No, 1=Yes] (or any mapping you prefer)

    struct Market {
        // Configuration
        uint8 outcomes;                // 2 or 3
        IERC20 stakeToken;             // USDC or any ERC-20 (network-specific address)
        uint96 feeBps;                 // fee on losing pools (e.g., 200 = 2%)
        uint64 closeTime;              // timestamp when betting closes
        string metadataURI;            // JSON with rules: 90', ET/Pens, official source, refund policy, etc.

        // State
        MarketState state;
        uint8 winningOutcome;          // valid when Resolved
        uint64 disputeWindow;          // seconds (e.g., 86400 = 24h)
        uint64 resultProposedAt;       // proposal timestamp
        uint8 proposedOutcome;         // proposed outcome

        // Totals per outcome
        mapping(uint8 => uint256) pool; // sum of stakes per outcome

        // For claims
        mapping(address => mapping(uint8 => uint256)) userStake; // user -> outcome -> amount
        mapping(address => bool) claimed; // prevents double-claim after resolve/cancel
        uint256 totalStaked;           // sum of all pools
    }

    address public owner;              // recommend multisig in production
    mapping(uint256 => Market) internal markets;
    uint256 public marketCount;

    // --- Events ---
    event MarketOpened(uint256 indexed id, uint8 outcomes, address stakeToken, uint64 closeTime, uint96 feeBps, uint64 disputeWindow, string metadataURI);
    event BetPlaced(uint256 indexed id, address indexed user, uint8 outcome, uint256 amount);
    event MarketClosed(uint256 indexed id);
    event ResultProposed(uint256 indexed id, uint8 outcome);
    event Disputed(uint256 indexed id, address indexed by);
    event MarketResolved(uint256 indexed id, uint8 winningOutcome);
    event MarketCanceled(uint256 indexed id);
    event Claimed(uint256 indexed id, address indexed user, uint256 amount);
    event OwnerChanged(address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor(address _owner) {
        owner = _owner == address(0) ? msg.sender : _owner;
    }

    // --- Admin / Config ---
    function setOwner(address _owner) external onlyOwner {
        require(_owner != address(0), "ZERO_ADDR");
        owner = _owner;
        emit OwnerChanged(_owner);
    }

    /**
     * @param outcomes      2 (binary) or 3 (1X2)
     * @param stakeToken    ERC-20 collateral (e.g., USDC on that network)
     * @param closeTime     timestamp when bets close
     * @param feeBps        fee in basis points taken from losing pools (0-10000)
     * @param disputeWindow seconds (e.g., 86400 = 24h)
     * @param metadataURI   market rules (JSON/IPFS/https)
     */
    function openMarket(
        uint8 outcomes,
        address stakeToken,
        uint64 closeTime,
        uint96 feeBps,
        uint64 disputeWindow,
        string calldata metadataURI
    ) external onlyOwner returns (uint256 id) {
        require(outcomes == 2 || outcomes == 3, "BAD_OUTCOMES");
        require(stakeToken != address(0), "ZERO_TOKEN");
        require(closeTime > block.timestamp, "BAD_CLOSE");
        require(feeBps <= 10_000, "FEE_BPS");

        id = ++marketCount;
        Market storage m = markets[id];
        m.outcomes = outcomes;
        m.stakeToken = IERC20(stakeToken);
        m.feeBps = feeBps;
        m.closeTime = closeTime;
        m.disputeWindow = disputeWindow;
        m.metadataURI = metadataURI;
        m.state = MarketState.Open;

        emit MarketOpened(id, outcomes, stakeToken, closeTime, feeBps, disputeWindow, metadataURI);
    }

    // --- User: place bet ---
    function bet(uint256 id, uint8 outcome, uint256 amount) external nonReentrant {
        Market storage m = markets[id];
        require(m.state == MarketState.Open, "NOT_OPEN");
        require(block.timestamp < m.closeTime, "CLOSED");
        require(outcome < m.outcomes, "BAD_OUTCOME");
        require(amount > 0, "ZERO_AMOUNT");

        // Pull stake token from user (requires prior approve)
        require(m.stakeToken.transferFrom(msg.sender, address(this), amount), "TRANSFER_FAIL");

        m.userStake[msg.sender][outcome] += amount;
        m.pool[outcome] += amount;
        m.totalStaked += amount;

        emit BetPlaced(id, msg.sender, outcome, amount);
    }

    // --- Close bets (time-based or admin backstop) ---
    function closeBets(uint256 id) external {
        Market storage m = markets[id];
        require(m.state == MarketState.Open, "NOT_OPEN");
        require(block.timestamp >= m.closeTime || msg.sender == owner, "TOO_EARLY");
        m.state = MarketState.Closed;
        emit MarketClosed(id);
    }

    // --- Simple Oracle: propose, dispute, finalize ---
    function proposeResult(uint256 id, uint8 outcome) external onlyOwner {
        Market storage m = markets[id];
        require(m.state == MarketState.Closed, "NOT_CLOSED");
        require(outcome < m.outcomes, "BAD_OUTCOME");

        m.proposedOutcome = outcome;
        m.resultProposedAt = uint64(block.timestamp);

        emit ResultProposed(id, outcome);
    }

    function dispute(uint256 id) external {
        Market storage m = markets[id];
        require(m.state == MarketState.Closed, "NOT_CLOSED");
        require(m.resultProposedAt != 0, "NO_PROPOSAL");
        require(block.timestamp < m.resultProposedAt + m.disputeWindow, "WINDOW_PASSED");

        // MVP behavior: a dispute just clears the proposal; owner must re-propose or cancel.
        m.resultProposedAt = 0;
        emit Disputed(id, msg.sender);
    }

    function finalize(uint256 id) external onlyOwner {
        Market storage m = markets[id];
        require(m.state == MarketState.Closed, "NOT_CLOSED");
        require(m.resultProposedAt != 0, "NO_PROPOSAL");
        require(block.timestamp >= m.resultProposedAt + m.disputeWindow, "IN_WINDOW");

        m.winningOutcome = m.proposedOutcome;
        m.state = MarketState.Resolved;

        emit MarketResolved(id, m.winningOutcome);
    }

    // Cancel (e.g., abandoned/postponed with policy → refund)
    function cancel(uint256 id) external onlyOwner {
        Market storage m = markets[id];
        require(m.state == MarketState.Open || m.state == MarketState.Closed, "BAD_STATE");
        m.state = MarketState.Canceled;
        emit MarketCanceled(id);
    }

    // --- Claim ---
    // Payout per $1 on the winning outcome: 1 + (sum(losing pools) * (1 - fee)) / winnersPool
    function claim(uint256 id) external nonReentrant {
        Market storage m = markets[id];
        require(m.state == MarketState.Resolved || m.state == MarketState.Canceled, "NOT_FINAL");
        require(!m.claimed[msg.sender], "ALREADY_CLAIMED");
        m.claimed[msg.sender] = true;

        uint256 payout;

        if (m.state == MarketState.Canceled) {
            // Refund: sum of user's stakes across all outcomes
            uint256 refund;
            for (uint8 o = 0; o < m.outcomes; o++) {
                refund += m.userStake[msg.sender][o];
            }
            payout = refund;
        } else {
            uint8 w = m.winningOutcome;
            uint256 userWinStake = m.userStake[msg.sender][w];
            if (userWinStake == 0) {
                payout = 0;
            } else {
                uint256 winnersPool = m.pool[w];
                uint256 losersPool = m.totalStaked - winnersPool;

                // netLosers = losersPool * (1 - feeBps/10000)
                uint256 netLosers = losersPool * (10_000 - m.feeBps) / 10_000;

                // payout = userStake * ( 1 + netLosers / winnersPool )
                payout = userWinStake + (userWinStake * netLosers / winnersPool);
            }
        }

        if (payout > 0) {
            require(m.stakeToken.transfer(msg.sender, payout), "PAY_FAIL");
        }

        emit Claimed(id, msg.sender, payout);
    }

    // --- Views / helpers ---
    function pools(uint256 id) external view returns (uint256[] memory arr) {
        Market storage m = markets[id];
        arr = new uint256[](m.outcomes);
        for (uint8 o = 0; o < m.outcomes; o++) {
            arr[o] = m.pool[o];
        }
    }

    function userStakes(uint256 id, address user) external view returns (uint256[] memory arr) {
        Market storage m = markets[id];
        arr = new uint256[](m.outcomes);
        for (uint8 o = 0; o < m.outcomes; o++) {
            arr[o] = m.userStake[user][o];
        }
    }

    // Returns the payout per 1 unit staked on `outcome` if it wins (scaled by 1e18 for UI math)
    function previewPayoutPer1(uint256 id, uint8 outcome) external view returns (uint256 per1e18) {
        Market storage m = markets[id];
        if (m.state != MarketState.Closed && m.state != MarketState.Open) return 0;
        require(outcome < m.outcomes, "BAD_OUTCOME");

        uint256 winnersPool = m.pool[outcome];
        if (winnersPool == 0) return 0;

        uint256 losersPool = m.totalStaked - winnersPool;
        uint256 netLosers = losersPool * (10_000 - m.feeBps) / 10_000;

        // per1 = 1 + netLosers / winnersPool
        // return scaled by 1e18: 1e18 + (netLosers * 1e18 / winnersPool)
        per1e18 = 1e18 + (netLosers * 1e18 / winnersPool);
    }
}