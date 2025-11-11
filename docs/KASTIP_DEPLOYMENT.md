# KAS Tipping System - Deployment Guide

## Overview

The **KAS Tipping System** is a fully-featured dApp that demonstrates all ecosystem integrations:
- ✅ **Tipping functionality** - Send KAS tips to anyone
- ✅ **Leaderboard** - Track top tippers
- ✅ **Proof-of-Utility** - Records usage events for rewards
- ✅ **Affiliate System** - Track referrals and earn rewards
- ✅ **GRID Token Rewards** - Earn GRID tokens for activity
- ✅ **dApp Token** - Automatic token deployment with fixed allocation

## What Was Built

### 1. Smart Contract (`contracts/KASTip.sol`)

**Features:**
- `tip(address _recipient, address _referral)` - Send tips with optional referral
- Leaderboard tracking (top 100 tippers)
- Automatic fee collection via FeeHandler
- Integration with ProofOfUtility for usage tracking
- Integration with AffiliateManager for referrals
- Statistics and analytics

**Ecosystem Integration:**
- Calls `ProofOfUtility.recordUsage()` after each tip
- Calls `AffiliateManager.recordReferral()` if referral provided
- Uses `FeeHandler.collectFee()` for fee distribution (60/40 split)

### 2. Frontend Widget (`src/components/dapps/KASTipWidget.tsx`)

**Features:**
- Tip form (recipient, amount, optional referral)
- Leaderboard display (top 10 tippers)
- User stats (total tipped, tip count, rank)
- Integration with ProofOfUtility component
- Integration with AffiliateWidget
- Integration with RewardsDisplay

**Tabs:**
- **Send Tip** - Main tipping interface
- **Leaderboard** - Top tippers ranking
- **My Stats** - Personal tipping statistics

### 3. Deployment Script (`scripts/deploy-dapp-with-token.js`)

**Updated to:**
- Deploy KASTip contract instead of SimplePayment
- Automatically deploy DAppToken
- Register in DAppRegistry
- Link token to dApp
- Set dApp ID in KASTip contract

## Deployment Instructions

### Prerequisites

1. **Environment Variables** (in `.env` or export before running):

```bash
# Required ecosystem addresses (from ECOSYSTEM_DEPLOYMENT_SUCCESS.md)
export PROOF_OF_UTILITY_ADDRESS=0x1aB97D324Ea68FF7c51A91689564377e433A77f6
export AFFILIATE_MANAGER_ADDRESS=0x374fa97A64A43c4fC0AD57dBf6EAE7Ee12924B04
export FEE_HANDLER_ADDRESS=0xedAb230E5613B07E72D454a843162E207d451A15

# Optional (uses defaults if not set)
export TREASURY_ADDRESS=0x305B4ee627aD8b12bFCF6427453964771aA30622
export DAPP_REGISTRY_ADDRESS=0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd
export REWARD_VAULT_ADDRESS=0x59e49E4f60397CC1C2F0eB3d7ebcF9C9c8AACCAD

# Optional dApp configuration
export DAPP_NAME="KAS Tipping System"
export DAPP_VERSION="1.0.0"
export DAPP_CATEGORY="social"
export TOKEN_NAME="KAS Tipping System Token"
export TOKEN_SYMBOL="KAST"
export TOKEN_MAX_SUPPLY="1000000"
```

### Deploy to Testnet

```bash
npm run hardhat:deploy:dapp:testnet
```

Or with custom configuration:

```bash
DAPP_NAME="KAS Tipping System" \
TOKEN_SYMBOL="KAST" \
TOKEN_MAX_SUPPLY="2000000" \
npm run hardhat:deploy:dapp:testnet
```

### What Happens During Deployment

1. **Deploys DAppToken** with fixed allocation:
   - 80% → Reward Vault (for use-to-mint rewards)
   - 10% → Liquidity Reserve
   - 5% → Treasury
   - 3% → Dev Address
   - 2% → Airdrop Address

2. **Deploys KASTip Contract** with ecosystem integrations

3. **Registers dApp** in DAppRegistry

4. **Sets dApp ID** in KASTip contract

5. **Links Token** to dApp in DAppRegistry

6. **Saves Deployment Info** to `deployments/dapp-{id}-{timestamp}.json`

## Post-Deployment Steps

### 1. Configure RewardManager

After deployment, configure rewards for the KASTip dApp:

```javascript
// In Hardhat console or script
const rewardManager = await ethers.getContractAt('RewardManager', REWARD_MANAGER_ADDRESS);
const kasTipAddress = '0x...'; // From deployment output

// Set reward rate (e.g., 100 = 1% of tip amount)
await rewardManager.setRewardRate(kasTipAddress, 100);

// Use GRID token for rewards
await rewardManager.setRewardType(kasTipAddress, true);

// Or use dApp token
await rewardManager.setRewardType(kasTipAddress, false);
await rewardManager.setDAppToken(kasTipAddress, TOKEN_ADDRESS);
```

### 2. Update Frontend

Add the dApp to `src/lib/dapps/placeholderDApps.ts`:

```typescript
{
  id: 'kastip',
  name: 'KAS Tipping System',
  description: 'Tip KAS to anyone and earn rewards',
  category: 'social',
  contractAddress: '0x...', // From deployment
  version: '1.0.0',
  // ... other fields
}
```

### 3. Test the dApp

1. **Connect Wallet** to Kasplex L2 Testnet
2. **Navigate** to the dApp detail page
3. **Send a Tip**:
   - Enter recipient address
   - Enter tip amount
   - Optionally add referral address
   - Click "Send Tip"
4. **Check Leaderboard** - See your rank
5. **View Stats** - See your tipping history
6. **Check Rewards** - Verify GRID/dApp token rewards
7. **Test Affiliate** - Use referral link with `?ref=0x...`

## Testing Ecosystem Features

### Proof-of-Utility

1. Send a tip
2. Check `ProofOfUtility` component - should show "tip" event
3. Verify event is recorded on-chain

### GRID Token Rewards

1. Configure RewardManager (see above)
2. Send tips
3. Check `RewardsDisplay` component - should show GRID balance increasing
4. Verify rewards are distributed automatically

### Affiliate System

1. Get your referral link: `https://...?ref=YOUR_ADDRESS`
2. Share with someone
3. When they tip using your link, you earn rewards
4. Check `AffiliateWidget` - should show referral count

### Leaderboard

1. Send multiple tips
2. Check "Leaderboard" tab
3. Verify your rank updates
4. See top tippers ranked by total tipped

## Contract Functions

### Public Functions

- `tip(address _recipient, address _referral)` - Send a tip
- `getTopTippers(uint256 _limit)` - Get top tippers
- `getUserRank(address _user)` - Get user's rank
- `getTotalTipsCount()` - Get total tips count
- `getRecipientTips(address _recipient)` - Get tips received
- `getSenderTips(address _sender)` - Get tips sent
- `getStats()` - Get contract statistics
- `calculateFee(uint256 _amount)` - Calculate fee for amount

### Owner Functions

- `setFeePercentage(uint256 _feePercentage)` - Update fee (max 10%)
- `updateEcosystemContract(string _contractName, address _newAddress)` - Update ecosystem contracts
- `setDAppId(uint256 _dAppId)` - Set dApp ID (called during deployment)

## Events

- `TipSent(address indexed from, address indexed to, uint256 amount, uint256 fee, address indexed referral, uint256 timestamp)`
- `LeaderboardUpdated(address indexed user, uint256 totalTipped, uint256 rank)`
- `FeePercentageUpdated(uint256 oldPercentage, uint256 newPercentage)`
- `EcosystemContractUpdated(string contractName, address oldAddress, address newAddress)`

## Troubleshooting

### "Missing ecosystem contract addresses"

Make sure you've set:
- `PROOF_OF_UTILITY_ADDRESS`
- `AFFILIATE_MANAGER_ADDRESS`
- `FEE_HANDLER_ADDRESS`

Find these in `ECOSYSTEM_DEPLOYMENT_SUCCESS.md`

### "dApp ID already set"

The dApp ID can only be set once. If you need to redeploy, deploy a new contract.

### Rewards not showing

1. Check RewardManager is configured for this dApp
2. Verify ProofOfUtility is recording events
3. Check RewardVault has tokens (for GRID) or token minting is enabled (for dApp token)

## Next Steps

1. Deploy to testnet
2. Test all features
3. Configure rewards
4. Add to frontend
5. Test with real users!

