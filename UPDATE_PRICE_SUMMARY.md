# Mint Price Update Summary

## Current Status

The mint price update to 10 KAS has encountered an issue:

1. ✅ Contract redeployed with `setMintPrice` function at: `0xc76515904e948698F67fCBc64f7d3b4C57602470`
2. ✅ Token is registered in the new contract with price: **0.1 KAS** (old price)
3. ❌ `setMintPrice` function call is failing with "execution reverted"

## Options to Fix

### Option 1: Use New Token ID (Recommended for Testing)
Since the token is already registered, use a new token ID with the 10 KAS price:

1. Update `.env`:
   ```env
   TOKEN_ID=test-genesis-v2
   MINT_PRICE=10
   ```

2. Run setup:
   ```bash
   npm run hardhat:setup:promo-token
   ```

### Option 2: Fix setMintPrice Function
The function might not be working correctly. Need to:
1. Verify the deployed contract has the function
2. Check if there's an issue with the function implementation
3. Possibly redeploy if needed

## Next Steps

For immediate testing, use **Option 1** (new token ID). This will allow you to test with 10 KAS immediately.
