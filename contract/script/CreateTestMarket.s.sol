// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";

interface IBetterPlay {
  function openMarket(address stakeToken, uint64 closeTime, uint96 feeBps, string calldata metadataURI)
    external returns (uint256 id);
}

contract CreateTestMarket is Script {
  uint96 constant DEFAULT_FEE_BPS = 200; // 2%

  function run() external {
    address betterplay = vm.envAddress("BETTERPLAY");
    address stakeToken = vm.envAddress("STAKE_TOKEN");
    uint96 feeBps = uint96(vm.envOr("FEE_BPS", uint256(DEFAULT_FEE_BPS)));

    // siempre en el futuro (30 min)
    uint64 closeTime = uint64(block.timestamp + 30 minutes);

    // metadata para identificar el test
    string memory meta = string.concat(
      "bp://test-futboltenis-fabi-lucho-",
      vm.toString(uint256(block.timestamp))
    );

    vm.startBroadcast();
    IBetterPlay(betterplay).openMarket(stakeToken, closeTime, feeBps, meta);
    vm.stopBroadcast();
  }
}