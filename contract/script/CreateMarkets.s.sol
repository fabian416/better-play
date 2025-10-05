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

contract CreateMarkets is Script {
  // ⚙️ Config default (podés sobreescribir por .env)
  uint96 constant DEFAULT_FEE_BPS = 200; // 2%

  function run() external {
    // 🔐 Lee variables de entorno (.env)
    // BETTERPLAY = address del contrato BetterPlay desplegado
    // STAKE_TOKEN = address del token (USDC o tu mock en esa red)
    // FEE_BPS (opcional) = fee en bps
    address betterplay = vm.envAddress("BETTERPLAY");
    address stakeToken = vm.envAddress("STAKE_TOKEN");
    uint96 feeBps = uint96(vm.envOr("FEE_BPS", uint256(DEFAULT_FEE_BPS)));

    IBetterPlay bp = IBetterPlay(betterplay);

    // ⏰ closeTime = kickoffUTC - 600s
    // Horarios calculados desde Argentina (UTC-3) a UTC, menos 10 minutos.
    // Partido 1..16 en el MISMO orden que tu frontend (id 1..16).
    uint64[16] memory closeTimes = [
      uint64(1759787400), // 1  Dep. Riestra vs Vélez (2025-10-06 19:00 AR) kickoff UTC=1759788000 -> -600
      uint64(1759794600), // 2  Racing vs Ind. Rivadavia (2025-10-06 21:00 AR)
      uint64(1760116800), // 3  San Lorenzo vs San Martín SJ (2025-10-10 14:30 AR)
      uint64(1760123100), // 4  Defensa y Justicia vs Argentinos (2025-10-10 16:15 AR)
      uint64(1760124900), // 5  Central Córdoba vs Unión (2025-10-10 16:45 AR)
      uint64(1760131200), // 6  Newell's vs Tigre (2025-10-10 18:30 AR)
      uint64(1760203200), // 7  Barracas vs Boca (2025-10-11 14:30 AR)
      uint64(1760211300), // 8  Gimnasia LP vs Talleres (2025-10-11 16:45 AR)
      uint64(1760219400), // 9  Banfield vs Racing (2025-10-11 19:00 AR)
      uint64(1760227500), // 10 Belgrano vs Estudiantes (2025-10-11 21:15 AR)
      uint64(1760227500), // 11 Vélez vs Rosario Central (2025-10-11 21:15 AR)
      uint64(1760289600), // 12 Aldosivi vs Huracán (2025-10-12 14:30 AR)
      uint64(1760297700), // 13 Ind. Rivadavia vs Godoy Cruz (2025-10-12 16:45 AR)
      uint64(1760297700), // 14 Instituto vs Atlético Tucumán (2025-10-12 16:45 AR)
      uint64(1760306700), // 15 River vs Sarmiento (2025-10-12 19:15 AR)
      uint64(1760313900)  // 16 Independiente vs Lanús (2025-10-12 21:15 AR)
    ];

    // Podés usar URIs reales (IPFS/HTTP). Para ahora, slugs cortitos que matchean tu frontend:
    string[16] memory metas = [
      "bp://2025-10-06-riestra-velez",
      "bp://2025-10-06-racing-ind-rivadavia",
      "bp://2025-10-10-sanlorenzo-sanmartinsj",
      "bp://2025-10-10-defensa-argentinos",
      "bp://2025-10-10-centralcordoba-union",
      "bp://2025-10-10-newells-tigre",
      "bp://2025-10-11-barracas-boca",
      "bp://2025-10-11-gimnasia-talleres",
      "bp://2025-10-11-banfield-racing",
      "bp://2025-10-11-belgrano-estudiantes",
      "bp://2025-10-11-velez-central",
      "bp://2025-10-12-aldosivi-huracan",
      "bp://2025-10-12-indrivadavia-godoycruz",
      "bp://2025-10-12-instituto-atleticotucuman",
      "bp://2025-10-12-river-sarmiento",
      "bp://2025-10-12-independiente-lanus"
    ];

    vm.startBroadcast(); // usa PRIVATE_KEY del entorno

    for (uint256 i = 0; i < 16; i++) {
      uint256 id = bp.openMarket(
        stakeToken,
        closeTimes[i],
        feeBps,
        metas[i]
      );
    }

    vm.stopBroadcast();
  }
}