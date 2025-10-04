// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20}   from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title SimpleToken6 - ERC20 with 6 decimals, owner-mintable
/// @notice Initial supply & mint amounts are specified in whole tokens (we scale by 10**6).
contract USDC is ERC20, Ownable {
    uint8 private constant _DECIMALS = 6;

    /// @param _name   Token name (e.g., "Better USD")
    /// @param _symbol Token symbol (e.g., "bUSD")
    /// @param _initialSupplyWhole Whole tokens (no decimals) to mint at deploy
    /// @param _owner  Contract owner and recipient of initial supply
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupplyWhole,
        address _owner
    ) ERC20(_name, _symbol) Ownable(_owner) {
        _mint(_owner, _toUnits(_initialSupplyWhole));
    }

    /// @inheritdoc ERC20
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /// @notice Owner can mint more tokens (amount in whole tokens)
    function mint(address to, uint256 amountWhole) external onlyOwner {
        _mint(to, _toUnits(amountWhole));
    }

    /// @dev Convert whole tokens -> smallest units (6 decimals)
    function _toUnits(uint256 whole) internal pure returns (uint256) {
        return whole * (10 ** _DECIMALS);
    }
}