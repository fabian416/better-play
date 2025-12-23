// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";

interface IBetterPlay {
  function openMarket(address stakeToken, uint64 closeTime, uint96 feeBps, string calldata metadataURI)
    external returns (uint256 id);
}

contract CreateFutbolTenisTomorrow is Script {
  uint96 constant DEFAULT_FEE_BPS = 200;

  function run() external {
    address betterplay = vm.envAddress("BETTERPLAY");
    address stakeToken = vm.envAddress("STAKE_TOKEN");
    uint96 feeBps = uint96(vm.envOr("FEE_BPS", uint256(DEFAULT_FEE_BPS)));

    // Cierra apuestas: 2025-12-23 10:00 AR
    uint64 closeTime = 1766494800;

    string memory meta = "bp://2025-12-23-fabi-vs-lucho-futboltenis";

    vm.startBroadcast();
    IBetterPlay(betterplay).openMarket(stakeToken, closeTime, feeBps, meta);
    vm.stopBroadcast();
  }
}