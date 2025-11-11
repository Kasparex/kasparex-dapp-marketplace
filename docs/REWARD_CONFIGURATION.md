# Reward Configuration Guide

## Overview

This guide explains how to configure rewards for dApps using the RewardManager contract. The configuration determines how users earn tokens when they interact with dApps.

## Quick Start

### For KASTip (Already Configured)

The KASTip dApp is already configured with:
- **Reward Rate**: 100 basis points (1% of tip amount)
- **Reward Type**: KAST token (dApp token)
- **Token Address**: `0x58f026dC9985a253620C5ceDE16EC6316E5085C1`

### Configure Any dApp

```bash
# Basic configuration (uses defaults)
npm run hardhat:configure:rewards

# Custom configuration
DAPP_CONTRACT_ADDRESS=0x... \
REWARD_RATE=200 \
USE_GRID=false \
DAPP_TOKEN_ADDRESS=0x... \
npm run hardhat:configure:rewards
```

## Configuration Options

### Reward Rate

The reward rate determines what percentage of the action value is rewarded to the user.

- **Basis Points**: 10000 = 100%
- **Example**: 100 = 1%, 500 = 5%, 1000 = 10%

**Recommendations:**
- **Small actions** (tips, votes): 50-200 basis points (0.5-2%)
- **Medium actions** (payments, subscriptions): 100-500 basis points (1-5%)
- **Large actions** (trades, deposits): 10-100 basis points (0.1-1%)

### Reward Type

Choose between GRID tokens or dApp-specific tokens:

#### Option 1: GRID Tokens (Ecosystem Token)

**Pros:**
- Unified reward currency across all dApps
- Users accumulate GRID from all activities
- Easier to manage and track

**Cons:**
- Requires GRID tokens in RewardManager
- Must fund RewardManager with GRID

**Setup:**
```bash
USE_GRID=true npm run hardhat:configure:rewards
```

**Fund RewardManager:**
```javascript
const GRIDToken = await ethers.getContractFactory('GRIDToken');
const gridToken = GRIDToken.attach('0x6c4B153eE2Fe3EfcD9CbF5D4A55e058d40Ec86a2');
const rewardManager = '0x2044FEb08a4Cb14Ff736b00f947E017044da50E6';

// Transfer GRID to RewardManager
await gridToken.transfer(rewardManager, ethers.parseEther('10000')); // 10K GRID
```

#### Option 2: dApp Tokens (dApp-Specific)

**Pros:**
- Users earn dApp-specific tokens
- Creates token utility for each dApp
- Tokens are minted on-demand (no pre-funding needed)

**Cons:**
- Each dApp needs its own token
- More tokens to manage

**Setup:**
```bash
USE_GRID=false \
DAPP_TOKEN_ADDRESS=0x... \
npm run hardhat:configure:rewards
```

## Default Setup for Future dApps

### Using the Default Setup Script

The `setup-default-rewards.js` script configures all dApps at once:

```bash
npm run hardhat:setup:default:rewards
```

### Adding New dApps to Default Setup

Edit `scripts/setup-default-rewards.js` and add your dApp to the `DEFAULT_DAPPS` array:

```javascript
const DEFAULT_DAPPS = [
  {
    name: 'KASTip',
    contractAddress: '0x962d06f6c11A95CBc02D5f965135368492d37Fd3',
    tokenAddress: '0x58f026dC9985a253620C5ceDE16EC6316E5085C1',
    tokenTicker: 'KAST',
    rewardRate: 100, // 1%
    useGRID: false, // Use KAST token
  },
  {
    name: 'Your New dApp',
    contractAddress: '0x...', // Your dApp contract
    tokenAddress: '0x...', // Your token contract
    tokenTicker: 'TICKER',
    rewardRate: 100, // 1%
    useGRID: true, // or false for dApp token
  },
];
```

## Configuration Workflow

### Step 1: Deploy dApp and Token

```bash
npm run hardhat:deploy:dapp:testnet
```

This automatically:
- Deploys the dApp contract
- Deploys the dApp token
- Registers in DAppRegistry

### Step 2: Configure Rewards

```bash
# Option A: Use default script (recommended)
npm run hardhat:setup:default:rewards

# Option B: Configure individually
DAPP_CONTRACT_ADDRESS=0x... \
REWARD_RATE=100 \
USE_GRID=false \
DAPP_TOKEN_ADDRESS=0x... \
npm run hardhat:configure:rewards
```

### Step 3: Verify Configuration

The script automatically verifies:
- ✅ Reward rate is set
- ✅ Reward type is set
- ✅ dApp token is linked (if using dApp token)
- ✅ Token availability (GRID balance or remaining supply)

## Reward Calculation

Rewards are calculated as:

```
Reward Amount = (Action Value × Reward Rate) / 10000
```

**Example:**
- User tips 1 KAS
- Reward rate: 100 basis points (1%)
- Reward: (1 KAS × 100) / 10000 = 0.01 KAS worth of tokens

The actual token amount depends on the token's value, but the calculation uses the action value (tip amount in this case).

## Current Configuration

### KASTip dApp

- **Contract**: `0x962d06f6c11A95CBc02D5f965135368492d37Fd3`
- **Reward Rate**: 100 basis points (1%)
- **Reward Type**: KAST token
- **Token**: `0x58f026dC9985a253620C5ceDE16EC6316E5085C1`

**How it works:**
1. User sends a 1 KAS tip
2. ProofOfUtility records "tip" event with action value = 1 KAS
3. RewardManager calculates: (1 KAS × 100) / 10000 = 0.01 KAS worth
4. User receives KAST tokens (minted from remaining supply)

## Best Practices

### 1. Start Conservative

- Begin with low reward rates (50-100 basis points)
- Monitor token distribution
- Adjust based on usage

### 2. Balance Rewards

- Too high: Token inflation, unsustainable
- Too low: Users don't engage, no incentive

### 3. Consider Token Supply

- For dApp tokens: Check remaining supply
- For GRID: Ensure RewardManager is funded
- Monitor token distribution over time

### 4. Test Before Mainnet

- Configure on testnet first
- Test with small amounts
- Verify rewards are distributed correctly

## Troubleshooting

### "RewardManager has no GRID tokens"

**Solution:**
- Transfer GRID tokens to RewardManager, OR
- Switch to dApp token (set `USE_GRID=false`)

### "No remaining supply for minting"

**Solution:**
- Check dApp token remaining supply
- Consider increasing max supply, OR
- Switch to GRID tokens

### "Rewards not showing"

**Solution:**
1. Verify RewardManager is configured
2. Check ProofOfUtility is recording events
3. Verify reward rate > 0
4. Check token availability (GRID balance or remaining supply)

## Scripts Reference

### `configure-rewards.js`

Configure rewards for a single dApp.

**Environment Variables:**
- `DAPP_CONTRACT_ADDRESS` - dApp contract address
- `REWARD_RATE` - Reward rate in basis points (default: 100)
- `USE_GRID` - Use GRID (true) or dApp token (false, default: true)
- `DAPP_TOKEN_ADDRESS` - dApp token address (required if USE_GRID=false)

### `setup-default-rewards.js`

Configure rewards for all dApps in the DEFAULT_DAPPS array.

**Environment Variables:**
- `DEFAULT_REWARD_RATE` - Default reward rate (default: 100)
- `DEFAULT_USE_GRID` - Default to GRID (default: true)

## Future Enhancements

- **Dynamic Reward Rates**: Adjust rates based on usage
- **Tiered Rewards**: Different rates for different user tiers
- **Time-based Rewards**: Bonus rewards during specific periods
- **Referral Bonuses**: Extra rewards for referred users

---

**Note**: Always test reward configurations on testnet before deploying to mainnet!

