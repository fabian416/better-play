export const BETTER_PLAY_ABI = [
  {
    "type": "function",
    "name": "bet",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "id", "type": "uint256" },
      { "name": "outcome", "type": "uint8" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "pools",
    "stateMutability": "view",
    "inputs": [{ "name": "id", "type": "uint256" }],
    "outputs": [
      { "name": "home", "type": "uint256" },
      { "name": "draw", "type": "uint256" },
      { "name": "away", "type": "uint256" }
    ]
  },
  // ✅ AGREGAR ESTA FUNCIÓN
  {
    "type": "function",
    "name": "userStakes",
    "stateMutability": "view",
    "inputs": [
      { "name": "id", "type": "uint256" },
      { "name": "user", "type": "address" }
    ],
    "outputs": [
      { "name": "home", "type": "uint256" },
      { "name": "draw", "type": "uint256" },
      { "name": "away", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "previewPayoutPer1",
    "stateMutability": "view",
    "inputs": [
      { "name": "id", "type": "uint256" },
      { "name": "outcome", "type": "uint8" }
    ],
    "outputs": [{ "name": "per1e18", "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "getMarket",
    "stateMutability": "view",
    "inputs": [{ "name": "id", "type": "uint256" }],
    "outputs": [
      { "name": "stakeToken", "type": "address" },
      { "name": "feeBps", "type": "uint96" },
      { "name": "closeTime", "type": "uint64" },
      { "name": "metadataURI", "type": "string" },
      { "name": "state", "type": "uint8" },
      { "name": "winningOutcome", "type": "uint8" },
      { "name": "totalStaked", "type": "uint256" }
    ]
  },
  // ✅ TAMBIÉN NECESITAS LA FUNCIÓN CLAIM
  {
    "type": "function",
    "name": "claim",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "id", "type": "uint256" }],
    "outputs": []
  },
  // ✅ Y LOS EVENTOS PARA TRACKING
  {
    "type": "event",
    "name": "BetPlaced",
    "inputs": [
      { "name": "id", "type": "uint256", "indexed": true },
      { "name": "user", "type": "address", "indexed": true },
      { "name": "outcome", "type": "uint8", "indexed": false },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "Claimed",
    "inputs": [
      { "name": "id", "type": "uint256", "indexed": true },
      { "name": "user", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "MarketResolved",
    "inputs": [
      { "name": "id", "type": "uint256", "indexed": true },
      { "name": "winningOutcome", "type": "uint8", "indexed": false }
    ]
  }
] as const