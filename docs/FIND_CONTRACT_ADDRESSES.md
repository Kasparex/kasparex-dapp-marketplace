# How to Find Your Contract Addresses

## Quick Answer

Use the **Contract Address** (not deployer address) from your deployment files.

## Where to Find Addresses

### 1. **DEPLOYMENT_SUCCESS.md** (Easiest)

Open `DEPLOYMENT_SUCCESS.md` in your project root. You'll see:

| Contract | Address |
|----------|---------|
| **Treasury** | `0x305B4ee627aD8b12bFCF6427453964771aA30622` |
| **DAppRegistry** | `0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd` |

**Use these addresses** - they are the contract addresses you need.

### 2. **src/lib/contracts/addresses.ts**

Check the `HARDCODED_FALLBACK_ADDRESSES` section:

```typescript
kasplexL2Testnet: {
  Treasury: "0x305B4ee627aD8b12bFCF6427453964771aA30622",
  DAppRegistry: "0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd",
  // ...
}
```

### 3. **Block Explorer**

If you deployed contracts, check the explorer:
- Testnet: https://explorer.testnet.kasplextest.xyz/
- Search for your deployer address
- Find the contract creation transactions
- The "Contract Address" is what you need

## For Ecosystem Deployment

When running `deploy-ecosystem.js`, you need:

### Required:
- **TREASURY_ADDRESS** - The Treasury contract address
  - Testnet: `0x305B4ee627aD8b12bFCF6427453964771aA30622`

### Optional (but recommended):
- **DAPP_REGISTRY_ADDRESS** - For AdminDashboard deployment
  - Testnet: `0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd`

### Optional (defaults to deployer):
- **PROJECT_TREASURY** - Project-specific treasury (defaults to deployer)
- **REWARD_VAULT_ADDRESS** - Will be created, but can specify
- **LIQUIDITY_RESERVE_ADDRESS** - Defaults to deployer
- **DEV_ADDRESS** - Defaults to deployer
- **AIRDROP_ADDRESS** - Defaults to deployer

## Setting Environment Variables

### Option 1: Export before running

```bash
# Windows PowerShell
$env:TREASURY_ADDRESS="0x305B4ee627aD8b12bFCF6427453964771aA30622"
$env:DAPP_REGISTRY_ADDRESS="0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd"

npm run hardhat:deploy:ecosystem:testnet
```

```bash
# Linux/Mac
export TREASURY_ADDRESS=0x305B4ee627aD8b12bFCF6427453964771aA30622
export DAPP_REGISTRY_ADDRESS=0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd

npm run hardhat:deploy:ecosystem:testnet
```

### Option 2: Add to .env file

Create or update `.env` in project root:

```env
TREASURY_ADDRESS=0x305B4ee627aD8b12bFCF6427453964771aA30622
DAPP_REGISTRY_ADDRESS=0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd
```

Then run:
```bash
npm run hardhat:deploy:ecosystem:testnet
```

## Quick Reference: Your Testnet Addresses

Based on `DEPLOYMENT_SUCCESS.md`:

```
Treasury:         0x305B4ee627aD8b12bFCF6427453964771aA30622
DAppRegistry:     0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd
FeeCollector:     0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2
SimplePayment:    0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85
```

## Difference: Contract Address vs Deployer Address

- **Contract Address**: The address where the contract is deployed (what you need)
- **Deployer Address**: Your wallet address that deployed it (not what you need)

Always use the **Contract Address**!


