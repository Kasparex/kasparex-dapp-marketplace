# Smart Contracts Setup Guide

## Overview

All smart contracts have been created and are ready for deployment. The contracts include:
- **Treasury.sol** - Fee collection and revenue distribution
- **FeeCollector.sol** - Interface for dApps to send fees
- **DAppRegistry.sol** - Registry for tracking deployed dApps
- **SimplePayment.sol** - First dApp with automatic fee collection

## Important Note: Hardhat v3 ESM Requirement

Hardhat v3 requires ESM (ES Modules). Since this is a Next.js project that uses CommonJS, there are two options:

### Option 1: Use Hardhat v2 (Recommended for now)
```bash
pnpm remove hardhat @nomicfoundation/hardhat-toolbox
pnpm add -D hardhat@^2.19.0 @nomicfoundation/hardhat-toolbox@^3.0.0
```

Then rename `hardhat.config.mjs` to `hardhat.config.js` and convert scripts back to CommonJS.

### Option 2: Keep Hardhat v3 and Use ESM
The config file is already set up as `hardhat.config.mjs`. You may need to:
1. Ensure scripts use `.mjs` extension or are properly configured for ESM
2. Test compilation: `npx hardhat compile`

## File Structure

```
contracts/
  ├── Treasury.sol
  ├── FeeCollector.sol
  ├── DAppRegistry.sol
  └── SimplePayment.sol

scripts/
  ├── deploy.js
  └── configure-treasury.js

src/
  ├── lib/
  │   ├── contracts/
  │   │   ├── addresses.ts
  │   │   └── abis.ts
  │   └── revenue/
  │       └── feeCalculator.ts
  └── components/
      └── dapps/
          └── SimplePaymentWidget.tsx
```

## Deployment

### 1. Set up environment variables

Create a `.env` file:
```env
PRIVATE_KEY=your_private_key_here
DEVELOPER_ADDRESS=0x...
BUILDER_ADDRESS=0x...
```

### 2. Compile contracts
```bash
pnpm hardhat:compile
```

### 3. Deploy to testnet
```bash
pnpm hardhat:deploy:testnet
```

### 4. Update frontend environment variables

After deployment, update `.env.local`:
```env
NEXT_PUBLIC_TREASURY_ADDRESS=0x...
NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS=0x...
NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS=0x...
```

## Using the Simple Payment Widget

The `SimplePaymentWidget` component is ready to use. Import it in your pages:

```tsx
import { SimplePaymentWidget } from '@/components/dapps/SimplePaymentWidget';

export default function PaymentPage() {
  return (
    <div>
      <SimplePaymentWidget />
    </div>
  );
}
```

## Revenue Model

- **Transaction Fees**: 1% (configurable) per SimplePayment transaction
- **Distribution**: 40% Treasury, 30% Developers, 30% Builders
- All fees are automatically collected and can be distributed via the Treasury contract

## Next Steps

1. Test contracts on local Hardhat network
2. Deploy to testnet and verify
3. Integrate SimplePaymentWidget into the dApp marketplace
4. Add more dApp contracts following the same pattern
5. Build Token Builder UI for linking dApps to tokens

## Contract Addresses

After deployment, contract addresses will be saved to `deployments/{network}.json`. Update the frontend `src/lib/contracts/addresses.ts` or use environment variables.


