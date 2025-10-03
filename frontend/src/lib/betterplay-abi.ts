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
  }
] as const