# Deploy Genesis Badge on IGRA Galleon Testnet

One-time setup to deploy the Genesis Badge contract and wire it to FeeRouter and LoyaltyPoints.

## Prerequisites

- Node and npm installed
- `.env` with `PRIVATE_KEY` (wallet that is **owner** of FeeRouter and LoyaltyPoints on IGRA Galleon Testnet, or reuse the same deployer used for the stack)
- Optional: `IGRA_GALLEON_TESTNET_RPC` if you need a custom RPC (default: `https://galleon-testnet.igralabs.com:8545`)

## Deploy and wire

From the project root:

```bash
npm run hardhat:deploy:genesis-badge
```

Or:

```bash
npx hardhat run scripts/deploy-genesis-badge.js --network igraGalleonTestnet
```

The script will:

1. Deploy `GenesisBadge` with the FeeRouter address (default for 38836: `0x37c98699eEe02Cb89da64C45B8c970174218A745`).
2. Call `FeeRouter.setAuthorizedDApp(genesisBadgeAddress, true)`.
3. Call `FeeRouter.setBaseReward("genesis-badge", 500e18)` (500 tGRID per 1 iKAS).
4. Call `LoyaltyPoints.setPointsPer1iKAS("genesis-badge", 100)` (100 XP per 1 iKAS).
5. Write `deployments/genesis-badge-igra-galleon-testnet.json` and print the env line.

## After deploy

Add to your `.env` (and to Vercel / your host env) the line printed at the end, e.g.:

```
NEXT_PUBLIC_GENESIS_BADGE_ADDRESS_IGRA_GALLEON_TESTNET=0x...
NEXT_PUBLIC_GENESIS_BADGE_ADDRESS_38836=0x...
```

Restart the dev server or trigger a new build so the app picks up the address. The Genesis Badge dApp will then use this contract on IGRA Galleon Testnet.

## Overriding FeeRouter / LoyaltyPoints

If your stack uses different addresses:

- `FEE_ROUTER_ADDRESS` – FeeRouter contract address
- `LOYALTY_POINTS_ADDRESS` – LoyaltyPoints contract address

Example:

```bash
FEE_ROUTER_ADDRESS=0x... LOYALTY_POINTS_ADDRESS=0x... npm run hardhat:deploy:genesis-badge
```
