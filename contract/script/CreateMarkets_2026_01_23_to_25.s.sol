// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";

interface IBetterPlay {
  function openMarket(address stakeToken, uint64 closeTime, uint96 feeBps, string calldata metadataURI)
    external
    returns (uint256 id);
}

contract CreateMarkets_2026_01_23_to_25 is Script {
  uint96 constant DEFAULT_FEE_BPS = 200;

  uint64 constant CLOSE_INDEPENDIENTE_ESTUDIANTES = 1769208300;
  uint64 constant CLOSE_TALLERES_NEWELLS          = 1769216400;
  uint64 constant CLOSE_GIMNASIA_RACING           = 1769292900;
  uint64 constant CLOSE_BOCA_RIESTRA              = 1769375700;
  uint64 constant CLOSE_BARRACAS_RIVER            = 1769283900;

  function run() external {
    address betterplay = vm.envAddress("BETTERPLAY");
    address stakeToken = vm.envAddress("STAKE_TOKEN");
    uint96 feeBps = uint96(vm.envOr("FEE_BPS", uint256(DEFAULT_FEE_BPS)));

    require(CLOSE_INDEPENDIENTE_ESTUDIANTES > block.timestamp, "CLOSE_1_IN_PAST");
    require(CLOSE_TALLERES_NEWELLS > block.timestamp, "CLOSE_2_IN_PAST");
    require(CLOSE_GIMNASIA_RACING > block.timestamp, "CLOSE_3_IN_PAST");
    require(CLOSE_BOCA_RIESTRA > block.timestamp, "CLOSE_4_IN_PAST");
    require(CLOSE_BARRACAS_RIVER > block.timestamp, "CLOSE_5_IN_PAST");

    vm.startBroadcast();

    IBetterPlay(betterplay).openMarket(
      stakeToken, CLOSE_INDEPENDIENTE_ESTUDIANTES, feeBps,
      "https://tu-dominio.com/metadata/2026-01-23-independiente-vs-estudiantes.json"
    );

    IBetterPlay(betterplay).openMarket(
      stakeToken, CLOSE_TALLERES_NEWELLS, feeBps,
      "https://tu-dominio.com/metadata/2026-01-23-talleres-vs-newells.json"
    );

    IBetterPlay(betterplay).openMarket(
      stakeToken, CLOSE_GIMNASIA_RACING, feeBps,
      "https://tu-dominio.com/metadata/2026-01-24-gimnasia-lp-vs-racing.json"
    );

    IBetterPlay(betterplay).openMarket(
      stakeToken, CLOSE_BOCA_RIESTRA, feeBps,
      "https://tu-dominio.com/metadata/2026-01-25-boca-vs-riestra.json"
    );

    IBetterPlay(betterplay).openMarket(
      stakeToken, CLOSE_BARRACAS_RIVER, feeBps,
      "https://tu-dominio.com/metadata/2026-01-24-barracas-vs-river.json"
    );

    vm.stopBroadcast();
  }
}