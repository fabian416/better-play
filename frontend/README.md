# BetterPlay Frontend

A React + TypeScript frontend for the BetterPlay betting platform with web3 integration.

## Features

- Connect wallet with RainbowKit (supports MetaMask, WalletConnect, etc.)
- Place bets on 1X2 outcomes using USDC on Polygon
- Real-time payout preview using on-chain data
- Responsive UI with Tailwind CSS

## Setup

1. Install dependencies:

```bash
yarn install
```

2. Create a `.env.local` file with the following variables:

```env
# Wallet Connect Project ID from https://cloud.walletconnect.com/
VITE_WALLET_CONNECT_PROJECT_ID=your_wc_project_id

# Contract addresses on Polygon
VITE_BETTER_PLAY_ADDRESS=0xYourBetterPlayAddressOnPolygon
VITE_USDC_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174

# Chain ID (137 for Polygon mainnet, 80002 for Polygon Amoy testnet)
VITE_CHAIN_ID=137
```

3. Start the development server:

```bash
yarn dev
```

## Environment Variables

- `VITE_WALLET_CONNECT_PROJECT_ID`: Get this from [WalletConnect Cloud](https://cloud.walletconnect.com/)
- `VITE_BETTER_PLAY_ADDRESS`: The deployed BetterPlay contract address on Polygon
- `VITE_USDC_ADDRESS`: USDC contract address (use `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` for Polygon mainnet)
- `VITE_CHAIN_ID`: Chain ID (137 for Polygon mainnet, 80002 for Amoy testnet)

## How to Use

1. Connect your wallet using the Connect button in the header
2. Navigate to a match and select an outcome (Home/Draw/Away)
3. Enter your bet amount in USDC
4. Click "Aprobar y Apostar" to approve USDC spending and place your bet
5. View potential payout based on current pool odds

## Contract Integration

The frontend integrates with the BetterPlay smart contract to:

- Read market pools and current odds
- Preview payout per 1 USDC using `previewPayoutPer1`
- Handle USDC approval and betting transactions
- Display real-time market data

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Wagmi + Viem for Ethereum interactions
- RainbowKit for wallet connection
- React Router for navigation
