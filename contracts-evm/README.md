# CHAIN CLASH EVM Contracts (Base / Hardhat)

This workspace migrates the original Move contracts to Solidity for Base-compatible deployment.

## Contracts

- `Brawlers.sol`
  - Mint up to 6 creatures per wallet
  - Creature stats and rarity multipliers
  - Username mapping
  - XP/win/loss and level-up logic
- `Battle.sol`
  - PvE battle start
  - PvP challenge + accept with escrowed wager
  - Turn-based move submission and resolution
  - XP rewards and wager payout
- `Tournament.sol`
  - Create tournaments
  - Enter up to 8 players with entry fee escrow
  - Mark winner and claim prize pool

## Setup

```bash
cd contracts-evm
npm install
cp .env.example .env
```

Fill `.env` with:

- `BASE_SEPOLIA_RPC_URL`
- `PRIVATE_KEY` (without `0x`)

## Compile & Test

```bash
npm run build
npm run test
```

## Deploy to Base Sepolia

```bash
npm run deploy:base-sepolia
```

The deploy script prints addresses for `Brawlers`, `Battle`, and `Tournament` and links `Battle` as the authorized XP updater in `Brawlers`.
