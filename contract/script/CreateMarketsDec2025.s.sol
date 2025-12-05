// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";

interface IBetterPlay {
  function openMarket(
    address stakeToken,
    uint64 closeTime,
    uint96 feeBps,
    string calldata metadataURI
  ) external returns (uint256 id);
}

contract CreateMarketsDec2025 is Script {
  uint96 constant DEFAULT_FEE_BPS = 200; // 2%

  function run() external {
    address betterplay = vm.envAddress("BETTERPLAY");
    address stakeToken = vm.envAddress("STAKE_TOKEN");
    uint96 feeBps = uint96(vm.envOr("FEE_BPS", uint256(DEFAULT_FEE_BPS)));

    IBetterPlay bp = IBetterPlay(betterplay);

    // closeTime = kickoffUTC - 300s (5 minutos)
    uint64[2] memory closeTimes = [
      uint64(1765144500), // Boca vs Racing (2025-12-07 19:00 AR)
      uint64(1765223700)  // Gimnasia vs Estudiantes (2025-12-08 17:00 AR)
    ];

    string[2] memory metas = [
      "bp://2025-12-07-boca-racing",
      "bp://2025-12-08-gimnasia-estudiantes"
    ];

    vm.startBroadcast();

    for (uint256 i = 0; i < 2; i++) {
      bp.openMarket(stakeToken, closeTimes[i], feeBps, metas[i]);
    }

    vm.stopBroadcast();
  }
}