// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * BetterPlay.sol — Parimutuel MVP (1X2 only) with USDC/any ERC-20 stable.
 *
 * Features:
 * - 1X2 outcomes: [0=Home, 1=Draw, 2=Away] (90' match result)
 * - Fee (bps) taken from losing pools and redistributed pro-rata to winners
 * - Owner-admin to open/cancel markets; dedicated resolver (owner or Chainlink consumer) to resolve
 * - Pull payments via individual claim() (no user loops)
 * - No dispute window (MVP): trust-based resolution by resolver
 *
 * Notes:
 * - Works on any EVM network; pass the stake token address (e.g., USDC on that chain).
 * - Token decimals are used implicitly (no rescaling). USDC commonly has 6 decimals.
 */

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract BetterPlay is Ownable, ReentrancyGuard {
    constructor(address initialOwner) Ownable(initialOwner) {}

	// --- Outcome constants for clarity (1X2) ---
	uint8 public constant HOME = 0;
	uint8 public constant DRAW = 1;
	uint8 public constant AWAY = 2;

	// --- Market state ---
	enum MarketState { Open, Closed, Resolved, Canceled }

	struct Market {
		// Configuration
		IERC20 stakeToken;     // e.g., USDC
		uint96 feeBps;         // fee on losing pools (0..10000, e.g., 200 = 2%)
		uint64 closeTime;      // unix time when betting closes
		string metadataURI;    // JSON with rules: "90' only", source, kickoff, etc.

		// State
		MarketState state;
		uint8 winningOutcome;  // set when Resolved

		// Pools (1X2)
		mapping(uint8 => uint256) pool;                           // amount per outcome
		mapping(address => mapping(uint8 => uint256)) userStake;  // user -> outcome -> amount
		mapping(address => bool) claimed;                         // prevents double-claim
		uint256 totalStaked;                                      // sum of all three pools
	}

	// --- Roles ---
	address public resolver;  // authorized address to call resolve(); settable by owner

	// --- Markets storage ---
	mapping(uint256 => Market) private markets;
	uint256 public marketCount;

	// Fees accrued per market (owner withdrawable after resolve)
	mapping(uint256 => uint256) public feesAccrued;

	// --- Events ---
	event ResolverChanged(address indexed newResolver);
	event MarketOpened(
		uint256 indexed id,
		address indexed stakeToken,
		uint64 closeTime,
		uint96 feeBps,
		string metadataURI
	);
	event BetPlaced(uint256 indexed id, address indexed user, uint8 outcome, uint256 amount);
	event MarketClosed(uint256 indexed id);
	event MarketResolved(uint256 indexed id, uint8 winningOutcome);
	event MarketCanceled(uint256 indexed id);
	event Claimed(uint256 indexed id, address indexed user, uint256 amount);

	// --- Modifiers ---
	modifier onlyResolver() {
		require(msg.sender == resolver || msg.sender == owner(), "ONLY_RESOLVER_OR_OWNER");
		_;
	}

	// --- Admin: set resolver (owner or Chainlink consumer) ---
	function setResolver(address _resolver) external onlyOwner {
		resolver = _resolver;
		emit ResolverChanged(_resolver);
	}

	// --- Open a 1X2 market (Home/Draw/Away) ---
	function openMarket(
		address stakeToken,
		uint64 closeTime,
		uint96 feeBps,
		string calldata metadataURI
	) external onlyOwner returns (uint256 id) {
		require(stakeToken != address(0), "ZERO_TOKEN");
		require(closeTime > block.timestamp, "BAD_CLOSE");
		require(feeBps <= 10_000, "FEE_BPS");

		id = ++marketCount;

		Market storage m = markets[id];
		m.stakeToken = IERC20(stakeToken);
		m.feeBps = feeBps;
		m.closeTime = closeTime;
		m.metadataURI = metadataURI;
		m.state = MarketState.Open;

		emit MarketOpened(id, stakeToken, closeTime, feeBps, metadataURI);
	}

	// --- Place a bet on one of the 1X2 outcomes ---
	function bet(uint256 id, uint8 outcome, uint256 amount) external nonReentrant {
		Market storage m = markets[id];
		require(m.state == MarketState.Open, "NOT_OPEN");
		require(block.timestamp < m.closeTime, "CLOSED");
		require(outcome <= AWAY, "BAD_OUTCOME");  // 0..2 only
		require(amount > 0, "ZERO_AMOUNT");

		// Pull user's stake tokens (requires prior approve)
		require(m.stakeToken.transferFrom(msg.sender, address(this), amount), "TRANSFER_FAIL");

		m.userStake[msg.sender][outcome] += amount;
		m.pool[outcome] += amount;
		m.totalStaked += amount;

		emit BetPlaced(id, msg.sender, outcome, amount);
	}

	// --- Close bets (time guard; owner can backstop-close) ---
	function closeBets(uint256 id) external {
		Market storage m = markets[id];
		require(m.state == MarketState.Open, "NOT_OPEN");
		require(block.timestamp >= m.closeTime || msg.sender == owner(), "TOO_EARLY");
		m.state = MarketState.Closed;
		emit MarketClosed(id);
	}

	// --- Resolve directly (no dispute) ---
	// outcome must be one of HOME/DRAW/AWAY (0..2). This is a 90' market.
	function resolve(uint256 id, uint8 outcome) external onlyResolver {
		Market storage m = markets[id];
		require(m.state == MarketState.Closed, "NOT_CLOSED");
		require(outcome <= AWAY, "BAD_OUTCOME");

		m.winningOutcome = outcome;
		m.state = MarketState.Resolved;

		// Compute fees for this market: fee portion of losing pools
		uint256 winnersPool = m.pool[outcome];
		uint256 losersPool = m.totalStaked - winnersPool;
		uint256 feeAmt = (losersPool * m.feeBps) / 10_000;
		feesAccrued[id] = feeAmt;

		emit MarketResolved(id, outcome);
	}

	// --- Cancel (refund) e.g., postponed/suspended outside policy ---
	function cancel(uint256 id) external onlyOwner {
		Market storage m = markets[id];
		require(m.state == MarketState.Open || m.state == MarketState.Closed, "BAD_STATE");
		m.state = MarketState.Canceled;
		emit MarketCanceled(id);
	}

	// --- Claim winnings or refund ---
	// Pro-rata: payout = userStake + (userStake * netLosers / winnersPool)
	// where netLosers = (sum(losing pools) * (1 - feeBps/10000))
	function claim(uint256 id) external nonReentrant {
		Market storage m = markets[id];
		require(m.state == MarketState.Resolved || m.state == MarketState.Canceled, "NOT_FINAL");
		require(!m.claimed[msg.sender], "ALREADY_CLAIMED");
		m.claimed[msg.sender] = true;

		uint256 payout;

		if (m.state == MarketState.Canceled) {
			// Refund user's total stake across all outcomes
			uint256 refund;
			unchecked {
				refund = m.userStake[msg.sender][HOME]
				       + m.userStake[msg.sender][DRAW]
				       + m.userStake[msg.sender][AWAY];
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

				uint256 netLosers = losersPool * (10_000 - m.feeBps) / 10_000;
				payout = userWinStake + (userWinStake * netLosers / winnersPool);
			}
		}

		if (payout > 0) {
			require(m.stakeToken.transfer(msg.sender, payout), "PAY_FAIL");
		}

		emit Claimed(id, msg.sender, payout);
	}

	// --- Views / helpers ---

	// Return total amounts in each pool [home, draw, away]
	function pools(uint256 id) external view returns (uint256 home, uint256 draw, uint256 away) {
		Market storage m = markets[id];
		home = m.pool[HOME];
		draw = m.pool[DRAW];
		away = m.pool[AWAY];
	}

	// Return user's stakes per outcome [home, draw, away]
	function userStakes(uint256 id, address user) external view returns (uint256 home, uint256 draw, uint256 away) {
		Market storage m = markets[id];
		home = m.userStake[user][HOME];
		draw = m.userStake[user][DRAW];
		away = m.userStake[user][AWAY];
	}

	// Preview payout per 1 unit on a given outcome if that outcome wins (scaled by 1e18)
	function previewPayoutPer1(uint256 id, uint8 outcome) external view returns (uint256 per1e18) {
		Market storage m = markets[id];
		require(m.state == MarketState.Open || m.state == MarketState.Closed, "NOT_ACTIVE_OR_CLOSED");
		require(outcome <= AWAY, "BAD_OUTCOME");

		uint256 winnersPool = m.pool[outcome];
		if (winnersPool == 0) return 0;

		uint256 losersPool = m.totalStaked - winnersPool;
		uint256 netLosers  = losersPool * (10_000 - m.feeBps) / 10_000;

		// per1 = 1 + netLosers / winnersPool  → scale to 1e18 for UI math
		per1e18 = 1e18 + (netLosers * 1e18 / winnersPool);
	}

	// Return market config/state for UI
	function getMarket(uint256 id) external view returns (
		address stakeToken,
		uint96 feeBps,
		uint64 closeTime,
		string memory metadataURI,
		MarketState state,
		uint8 winningOutcome,
		uint256 totalStaked
	) {
		Market storage m = markets[id];
		stakeToken = address(m.stakeToken);
		feeBps = m.feeBps;
		closeTime = m.closeTime;
		metadataURI = m.metadataURI;
		state = m.state;
		winningOutcome = m.winningOutcome;
		totalStaked = m.totalStaked;
	}

	function withdrawFees(uint256 id, address to) external onlyOwner {
		uint256 amt = feesAccrued[id];
		feesAccrued[id] = 0;
		require(markets[id].stakeToken.transfer(to, amt), "FEE_TRANSFER_FAIL");
	}
}