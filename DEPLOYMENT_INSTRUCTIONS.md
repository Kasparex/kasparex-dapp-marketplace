# Deployment Instructions

## Quick Start

### Step 1: Create `.env` File

Create a `.env` file in the root directory with:

```env
PRIVATE_KEY=your_private_key_without_0x_prefix
```

**⚠️ IMPORTANT**: 
- Never commit the `.env` file to git
- Use a testnet wallet with testnet KAS tokens
- For mainnet, use a secure wallet with proper security measures

### Step 2: Deploy to Testnet

```bash
pnpm hardhat:deploy:testnet
```

Or directly:
```bash
npx hardhat run scripts/deploy.js --network kasplexL2Testnet
```

### Step 3: Deploy to Mainnet

⚠️ Only deploy to mainnet after thorough testing on testnet!

```bash
pnpm hardhat:deploy:mainnet
```

Or directly:
```bash
npx hardhat run scripts/deploy.js --network kasplexL2Mainnet
```

## Deployment Configuration

The deployment script will deploy all contracts in this order:

1. **Treasury** - Fee collection and revenue distribution
2. **FeeCollector** - Interface for dApps to send fees
3. **DAppRegistry** - Registry for tracking dApps
4. **SimplePayment** - First dApp with fee collection
5. **PlatformSubscription** - Platform-wide subscriptions
6. **DAppSubscription** - Per-dApp subscriptions
7. **SubscriptionManager** - Unified subscription manager

## Default Configuration

- **Treasury Distribution**: 40% Treasury, 30% Developers, 30% Builders
- **Transaction Fee**: 1% (SimplePayment)
- **Platform Subscription**: 10 KAS/month
- **Kasparex Fee**: 15% from subscriptions

## After Deployment

1. **Save Contract Addresses**: Deployment addresses are saved to `deployments/{network}.json`

2. **Update Frontend Environment Variables**: Add to `.env.local`:
```env
NEXT_PUBLIC_TREASURY_ADDRESS=0x...
NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS=0x...
NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS=0x...
NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS=0x...
NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS=0x...
NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS=0x...
```

3. **Verify Contracts** (Optional):
```bash
npx hardhat verify --network kasplexL2Testnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Troubleshooting

### "Cannot read properties of undefined"
- Make sure `.env` file exists with `PRIVATE_KEY`
- Check that private key is correct (no 0x prefix)

### "Insufficient funds"
- Make sure your wallet has enough KAS tokens for deployment
- Testnet tokens can be obtained from faucets

### "Network error"
- Check RPC URL in `hardhat.config.js`
- Verify network connectivity

