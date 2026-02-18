# Deploy Revenue Tree V1

## What you need

1. **Wallet with gas**  
   A wallet (EVM) with some native token on the target network (KAS on Kasplex, iKAS on IGRA) to pay for deployment.

2. **Private key in `.env`**  
   In the project root, create or edit `.env` and add:
   ```bash
   PRIVATE_KEY=0x...your_hex_private_key...
   ```
   Do not commit `.env`. It is loaded by Hardhat via `dotenv/config`.

## Optional env vars

| Variable | Description | Example |
|----------|-------------|---------|
| `PLATFORM_WALLET` | Receives platform share (default: deployer) | `0x...` |
| `FEE_COLLECTOR_ADDRESS` | If set, FeeRouter is deployed and wired | Kasplex testnet: `0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2` |
| `SIMPLE_PAYMENT_ADDRESS` | dApp to whitelist as authorized caller | Kasplex testnet: `0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85` |
| `TREE_BPS` | Basis points to tree (rest to treasury); default 5000 (50%) | `5000` |
| `GENESIS_1` … `GENESIS_5` | Override Genesis wallets (optional) | `0x...` |
| `KREX_TOKEN_ADDRESS` | On 38836, skip tKREX deploy and use this | `0x...` |

## Networks

| Network | Chain ID | Notes |
|---------|----------|--------|
| `kasplexL2Testnet` | 167012 | FeeCollector + SimplePayment already in codebase; set env to deploy FeeRouter |
| `kasplexL2Mainnet` | 202555 | Production |
| `igraGalleonTestnet` | 38836 | Deploys **tKREX** then RevenueTreeManager; no FeeCollector by default |
| `igraGalleonTestMainnet` | 38837 | Set FeeCollector/SimplePayment if you have them |
| `igraCaravelTestnet` | 19416 | Sunset; prefer Galleon |

## Commands

Deploy **RevenueTreeManager** only (and on 38836, **tKREX**):

```bash
npx hardhat run scripts/deploy-revenue-tree.js --network igraGalleonTestnet
```

Deploy **RevenueTreeManager + FeeRouter** on Kasplex L2 Testnet (wire to existing FeeCollector/SimplePayment):

```bash
set FEE_COLLECTOR_ADDRESS=0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2
set SIMPLE_PAYMENT_ADDRESS=0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85
npx hardhat run scripts/deploy-revenue-tree.js --network kasplexL2Testnet
```

(On macOS/Linux use `export` instead of `set`.)

## After deployment

1. **Output file**  
   Addresses are written to `deployments/revenue-tree-<network>.json`.

2. **App config**  
   - Update `src/lib/contracts/addresses.ts`: set `RevenueTreeManager` and `FeeRouter` (if used) for that network in `HARDCODED_FALLBACK_ADDRESSES` (and optionally env var names in `CONTRACT_ADDRESSES`).
   - For **IGRA Galleon Testnet (38836)** only: set `NEXT_PUBLIC_TKREX_ADDRESS_38836` in `.env` to the deployed tKREX address so the UI shows tKREX balance.

3. **SimplePayment → FeeRouter**  
   If you deployed FeeRouter, point SimplePayment (or your dApp) to use FeeRouter for fees: call `setFeeRouter(feeRouterAddress)` on the dApp contract (owner only), or deploy a new SimplePayment that uses FeeRouter by default.
