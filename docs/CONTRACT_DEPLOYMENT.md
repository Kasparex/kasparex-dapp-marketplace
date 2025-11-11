# Contract Deployment Guide

## Prerequisites

1. **Environment Setup**
   - Set up `.env` file with private keys and RPC URLs
   - Get testnet KAS for gas fees

2. **Required Addresses**
   - Treasury address (from previous deployment)
   - DAppRegistry address (from previous deployment)

## Deployment Order

### Step 1: Deploy Ecosystem Contracts

These contracts form the core infrastructure:

```bash
# Set required environment variables
export TREASURY_ADDRESS=0x...  # Your existing Treasury address
export DAPP_REGISTRY_ADDRESS=0x...  # Your existing DAppRegistry address
export PROJECT_TREASURY=0x...  # Optional: project-specific treasury

# Deploy to testnet
npm run hardhat:deploy:ecosystem:testnet
```

**Contracts deployed:**
1. **GRIDToken** - Fixed 10B supply, deflationary
2. **RewardVault** - Holds pre-minted tokens
3. **RewardManager** - Distributes rewards
4. **ProofOfUtility** - Tracks usage events
5. **FeeHandler** - Splits KAS fees (60/40)
6. **AffiliateManager** - Referral tracking
7. **LoyaltyPoints** - Long-term participation
8. **ProfileRegistry** - User profile storage
9. **UserProfileDashboard** - Profile management dApp
10. **AdminDashboard** - Admin operations (if DAppRegistry provided)

### Step 2: Update Contract Addresses

After deployment, update `src/lib/contracts/addresses.ts`:

```typescript
kasplexL2Testnet: {
  // ... existing addresses
  GRIDToken: "0x...",
  RewardVault: "0x...",
  RewardManager: "0x...",
  ProofOfUtility: "0x...",
  FeeHandler: "0x...",
  AffiliateManager: "0x...",
  LoyaltyPoints: "0x...",
  ProfileRegistry: "0x...",
  UserProfileDashboard: "0x...",
  AdminDashboard: "0x...",
}
```

### Step 3: Configure Contracts

After deployment, configure the contracts:

```javascript
// Link contracts together
await rewardVault.setRewardManager(rewardManagerAddress);
await proofOfUtility.setRewardManager(rewardManagerAddress);

// Set initial parameters
await feeHandler.setTreasuries(kasparexTreasury, projectTreasury);
await rewardManager.setRewardRate(dAppContract, rewardRate);
```

### Step 4: Deploy Individual dApp Tokens

dApp tokens are deployed individually when creating a dApp:

1. Use the Token Deployment Wizard (`/deploy-token`)
2. Or deploy directly using the DAppToken contract

**Deployment parameters:**
- Name: "My dApp Token"
- Symbol: "MDT" (max 10 chars)
- Max Supply: e.g., 1,000,000 tokens
- Allocation addresses (80/10/5/3/2 split)

## Deployment Scripts

### Ecosystem Contracts

```bash
# Testnet
npm run hardhat:deploy:ecosystem:testnet

# Mainnet (when ready)
npm run hardhat:deploy:ecosystem:mainnet
```

### Individual Contracts

```bash
# Deploy GRIDToken only
npx hardhat run scripts/deploy-grid.js --network kasplexL2Testnet

# Deploy FeeHandler only
npx hardhat run scripts/deploy-fee-handler.js --network kasplexL2Testnet
```

## Verification

After deployment, verify contracts on block explorer:

```bash
# Verify GRIDToken
npx hardhat verify --network kasplexL2Testnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Example
npx hardhat verify --network kasplexL2Testnet 0x... 0xRewardVaultAddress
```

## Configuration Checklist

After deployment:

- [ ] All contracts deployed and verified
- [ ] Contract addresses updated in code
- [ ] Contracts linked together (RewardManager → ProofOfUtility, etc.)
- [ ] Initial parameters set (fee rates, reward rates)
- [ ] Test token deployment works
- [ ] Test reward distribution works
- [ ] Test fee collection works

## Gas Estimates

Approximate gas costs (testnet):
- GRIDToken: ~2M gas
- RewardVault: ~500K gas
- RewardManager: ~1M gas
- ProofOfUtility: ~800K gas
- FeeHandler: ~600K gas
- AffiliateManager: ~700K gas
- LoyaltyPoints: ~400K gas
- ProfileRegistry: ~300K gas
- UserProfileDashboard: ~500K gas
- AdminDashboard: ~600K gas

**Total: ~7.4M gas** (approximately 0.074 KAS at 10 gwei)

## Troubleshooting

### "Insufficient funds"
- Get testnet KAS from faucet
- Check account balance: `npx hardhat run scripts/check-balance.js`

### "Contract already deployed"
- Check if contract already exists at address
- Use existing address or deploy to new address

### "Invalid constructor arguments"
- Verify all required addresses are set
- Check address format (must start with 0x)

## Next Steps

After successful deployment:
1. Update frontend with contract addresses
2. Test token deployment flow
3. Test reward distribution
4. Test fee collection
5. Deploy to mainnet when ready


