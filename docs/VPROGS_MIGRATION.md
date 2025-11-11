# vProgs Migration Guide

This guide explains how to migrate dApps and tokens from EVM Layer 2 to Kaspa vProgs Layer 1.

## Overview

The Kasparex dApps Marketplace is designed with a dual-layer architecture:
- **EVM Layer 2** (Kasplex L2): Current deployment, EVM-compatible
- **vProgs Layer 1**: Future deployment on Kaspa native Layer 1

## Migration Process

### 1. Export Data from EVM

Use the migration scripts to export dApp and token data:

```bash
node scripts/migrate-to-vprogs.js export --dapp-id 1
node scripts/migrate-to-vprogs.js export --token-address 0x...
```

### 2. Review Exported Data

Check the exported JSON files in the `exports/` directory to ensure all data is correct.

### 3. Deploy to vProgs

Once vProgs is available:

1. Deploy contracts to vProgs network
2. Import exported data using vProgs import functions
3. Verify migration on vProgs network

### 4. Update Contract Addresses

Update `src/lib/contracts/addresses.ts` with vProgs contract addresses.

## Contract Abstraction Layer

The contract abstraction layer (`src/lib/contracts/abstraction.ts`) provides a unified interface for both EVM and vProgs operations. The factory pattern (`src/lib/contracts/factory.ts`) automatically selects the appropriate implementation based on the network.

## Testing with Simulator

Before vProgs launch, use the vProgs simulator (`src/lib/vprogs/simulator.ts`) to test migration:

1. Export data from EVM
2. Import to simulator
3. Test functionality
4. When vProgs launches, repeat with real network

## Migration Checklist

- [ ] Export all dApp data
- [ ] Export all token data
- [ ] Review exported data
- [ ] Deploy contracts to vProgs
- [ ] Import dApp data
- [ ] Import token data
- [ ] Verify on vProgs network
- [ ] Update contract addresses
- [ ] Test functionality
- [ ] Update documentation

## Notes

- Token balances and allocations are preserved during migration
- IPFS CIDs remain valid (no re-upload needed)
- User profiles and preferences are maintained
- Historical usage events can be optionally migrated

