# Token Deployment Wizard - Explanation

## What is the Token Deployment Wizard?

The **Token Deployment Wizard** is a frontend React component (`TokenDeploymentWizard.tsx`) that provides a user-friendly interface for deploying ERC-20 tokens for dApps. It's designed to guide users through the token creation process step-by-step.

## How It Works

### Current Implementation (Frontend)

The wizard is a multi-step form that:

1. **Step 1: Token Configuration**
   - Token Name (e.g., "My dApp Token")
   - Token Symbol (e.g., "MDT")
   - Max Supply (e.g., 1,000,000 tokens)

2. **Step 2: Allocation Configuration**
   - Reward Vault address (80% of tokens for use-to-mint rewards)
   - Liquidity Reserve address (10% for DEX liquidity)
   - Treasury address (5% for Kasparex + Project)
   - Dev Address (3% for development/maintenance)
   - Airdrop Address (2% for airdrops & bonuses)

3. **Step 3: Review & Deploy**
   - Review all settings
   - Upload metadata to IPFS
   - Deploy the token contract

### Current Status

**⚠️ The wizard is currently incomplete:**
- The UI is fully built and functional
- The IPFS metadata upload works
- **The actual token deployment is not implemented yet** (lines 89-96 in `TokenDeploymentWizard.tsx` show placeholder comments)

### Why It's Not Complete

Deploying contracts from the frontend requires:
1. **Contract bytecode** - The compiled contract code
2. **Deployment method** - Either:
   - Direct deployment using `ethers.js` or `viem`
   - A Factory contract that creates tokens
   - A backend API that handles deployment

Currently, we don't have:
- A way to include contract bytecode in the frontend bundle (it's too large)
- A Factory contract for token deployment
- A backend deployment service

## Your Approach (Recommended)

You're taking the **right approach** for now:

1. **Deploy dApps through Hardhat scripts** (command line/Cursor)
2. **Automatic token deployment** as part of the script
3. **No frontend token deployment** until later

This is better because:
- ✅ More secure (you control deployments)
- ✅ Faster (no UI overhead)
- ✅ Easier to debug (direct script execution)
- ✅ Can be automated/scripted
- ✅ No need to bundle contract bytecode in frontend

## The New Script: `deploy-dapp-with-token.js`

I've created a script that:

1. **Deploys a DAppToken** with your specified configuration
2. **Deploys a dApp contract** (SimplePayment as example, you can customize)
3. **Registers the dApp** in DAppRegistry
4. **Links the token** to the dApp automatically
5. **Saves deployment info** to a JSON file

### Usage

```bash
# Basic usage (uses defaults)
npx hardhat run scripts/deploy-dapp-with-token.js --network kasplexL2Testnet

# With custom configuration
DAPP_NAME="My Awesome dApp" \
TOKEN_SYMBOL="MADT" \
TOKEN_MAX_SUPPLY="2000000" \
npx hardhat run scripts/deploy-dapp-with-token.js --network kasplexL2Testnet
```

### What Gets Deployed

1. **DAppToken Contract** - ERC-20 token with fixed allocation:
   - 80% → Reward Vault (for use-to-mint rewards)
   - 10% → Liquidity Reserve (locked until DEX)
   - 5% → Treasury (Kasparex + Project split)
   - 3% → Dev Address (development/maintenance)
   - 2% → Airdrop Address (airdrops & bonuses)

2. **dApp Contract** - Currently deploys SimplePayment as example
   - You can modify the script to deploy your custom dApp contract

3. **Registration** - Automatically registered in DAppRegistry with token linked

## Future: Frontend Token Deployment

When you're ready to allow users to deploy tokens from the frontend, you'll need:

1. **Option A: Factory Contract**
   - Deploy a `DAppTokenFactory` contract
   - Users call `factory.createToken(...)` from frontend
   - Factory handles all deployment logic

2. **Option B: Backend API**
   - Create a backend endpoint `/api/deploy-token`
   - Frontend sends token config to backend
   - Backend uses Hardhat/ethers to deploy
   - Returns token address to frontend

3. **Option C: Direct Frontend Deployment**
   - Bundle contract bytecode (large bundle size)
   - Use `ethers.js` or `viem` to deploy directly
   - Requires users to pay gas fees

**Recommendation:** Use Option A (Factory Contract) when ready - it's the most gas-efficient and user-friendly.

## Summary

- **Token Deployment Wizard** = Frontend UI component (currently incomplete)
- **Your approach** = Deploy via Hardhat scripts (recommended for now)
- **New script** = `deploy-dapp-with-token.js` automates everything
- **Future** = Add Factory contract when ready for user deployments

