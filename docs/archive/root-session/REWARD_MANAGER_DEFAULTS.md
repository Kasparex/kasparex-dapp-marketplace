# RewardManager Standard Default Settings

## Overview

This document defines the standard default settings for RewardManager configuration across all dApps in the Kasparex ecosystem.

## Standard Defaults

### Reward Rate
- **Default**: 100 basis points (1%)
- **Range**: 10-10000 basis points (0.1% - 100%)
- **Calculation**: Reward Amount = Action Value × Reward Rate

### Reward Type
- **Default**: GRID Token
- **Alternative**: dApp Token (requires token deployment)

### Common Reward Rates by Action Type

| Action Type | Recommended Rate | Basis Points | Example Use Cases |
|------------|-----------------|--------------|-------------------|
| Small Actions | 50-200 | 0.5-2% | Tips, votes, quizzes, small interactions |
| Medium Actions | 100-500 | 1-5% | Payments, subscriptions, medium transactions |
| Large Actions | 10-100 | 0.1-1% | Trades, deposits, large value transactions |

## Configuration Examples

### Example 1: Quiz-to-Earn (Small Action)
```javascript
Reward Rate: 100 basis points (1%)
Reward Type: GRID Token
Action Value: 0.01 KAS (question reward)
Reward Amount: 0.01 × 1% = 0.0001 KAS worth of GRID
```

### Example 2: Simple Payment (Medium Action)
```javascript
Reward Rate: 200 basis points (2%)
Reward Type: GRID Token
Action Value: 1 KAS (payment amount)
Reward Amount: 1 × 2% = 0.02 KAS worth of GRID
```

### Example 3: DAO Voting (Small Action)
```javascript
Reward Rate: 50 basis points (0.5%)
Reward Type: GRID Token
Action Value: 1 KAS (vote fee)
Reward Amount: 1 × 0.5% = 0.005 KAS worth of GRID
```

## GRID Token vs dApp Token

### GRID Token (Default)
**Pros:**
- Unified reward currency across all dApps
- Users accumulate GRID from all activities
- Easier to manage and track
- No token deployment required

**Cons:**
- Requires GRID tokens in RewardManager
- Must fund RewardManager with GRID

**Setup:**
```bash
USE_GRID=true npx hardhat run scripts/configure-dapp-rewards.js --network kasplexL2Testnet
```

### dApp Token
**Pros:**
- dApp-specific reward token
- Can create unique tokenomics
- Independent token supply

**Cons:**
- Requires token deployment
- Additional complexity
- Users need to hold multiple tokens

**Setup:**
```bash
USE_GRID=false DAPP_TOKEN_ADDRESS=0x... \
npx hardhat run scripts/configure-dapp-rewards.js --network kasplexL2Testnet
```

## Configuration Script Template

All dApps should have a configuration script following this pattern:

```javascript
// Standard defaults
const DEFAULT_REWARD_RATE = 100; // 1% (100 basis points)
const DEFAULT_USE_GRID = true; // Use GRID token by default

// Configuration
const rewardRate = process.env.REWARD_RATE || DEFAULT_REWARD_RATE;
const useGRID = process.env.USE_GRID !== undefined 
  ? process.env.USE_GRID === 'true' 
  : DEFAULT_USE_GRID;
```

## Best Practices

1. **Start with Defaults**: Use 1% rate and GRID token for new dApps
2. **Adjust Based on Action Value**: Higher value actions = lower rates
3. **Consider User Experience**: Too high rates may be unsustainable
4. **Monitor and Adjust**: Review reward distribution regularly
5. **Document Changes**: Keep track of reward rate changes

## Current Configurations

### Quiz-to-Earn
- **Reward Rate**: 100 basis points (1%)
- **Reward Type**: GRID Token
- **Status**: ✅ Configured

### DAO Voting
- **Reward Rate**: TBD
- **Reward Type**: TBD
- **Status**: ⏳ Pending

### Simple Payment
- **Reward Rate**: TBD
- **Reward Type**: TBD
- **Status**: ⏳ Pending

---

**Last Updated**: November 13, 2025

