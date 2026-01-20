# Update Mint Price to 100 KAS

The mint price is currently set to 0.1 KAS in the contract. To update it to 100 KAS, you need to re-register the token.

## Option 1: Re-register with New Token ID (Recommended)

1. Update `.env` file:
   ```env
   MINT_PRICE=100
   TOKEN_ID=test-genesis-v2  # Use a new token ID
   ```

2. Run the setup script:
   ```bash
   npm run hardhat:setup:promo-token
   ```

## Option 2: Update Existing Token (Requires Contract Modification)

The current contract doesn't support updating the mint price. You would need to:
1. Add a `setMintPrice` function to the contract
2. Deploy the updated contract
3. Call the function to update the price

**Note:** For now, the UI will display the price from the contract. To change it to 100 KAS, you'll need to re-register the token with the new price.
