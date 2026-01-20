# Promo Engine Quick Start Guide

## Prerequisites

1. **Deploy PromoMintRouter Contract**
   ```bash
   npm run hardhat:deploy:promo-router
   ```
   Copy the deployed address.

2. **Deploy a DAppToken** (or use existing token contract)
   - The token must have a `mint(address, uint256)` function
   - Set the PromoMintRouter as the minter

3. **Set Environment Variables**
   Create `.env` file with:
   ```env
   PROMO_MINT_ROUTER_ADDRESS=0x... # From step 1
   TOKEN_ADDRESS=0x... # Your DAppToken address
   TOKEN_ID=my-token # Token slug/identifier
   TOKEN_TICKER=TOKEN
   TOKEN_NAME=My Token
   MINT_PRICE=0.1 # KAS per mint
   TOKENS_PER_MINT=1000
   MINTABLE_SUPPLY=10000000
   CREATOR_WALLET=0x... # Token creator
   PLATFORM_WALLET=0x... # Kasparex platform wallet
   GENESIS_SLOT1=0x... # Deployer
   GENESIS_SLOT2=0x... # Liquidity
   GENESIS_SLOT3=0x... # Marketing
   GENESIS_SLOT4=0x... # Team
   GENESIS_SLOT5=0x... # Platform
   KASPAREX_API_URL=https://kasparex-api.kasparexcom.workers.dev
   ADMIN_AUTH_TOKEN=your-secure-token-here
   ```

4. **Initialize Database**
   ```bash
   cd workers
   wrangler d1 execute kasparex-nodes --file=./schema.sql
   ```

5. **Set Cloudflare Secrets**
   ```bash
   cd workers
   wrangler secret put RECAPTCHA_SECRET_KEY
   wrangler secret put ADMIN_AUTH_TOKEN
   ```

6. **Deploy Workers**
   ```bash
   cd workers
   wrangler deploy
   ```

7. **Register First Token**
   ```bash
   npm run hardhat:setup:promo-token
   ```

## Testing

1. Visit: `/tokens/{TOKEN_ID}/promo/{genesis_page_id}`
2. Connect wallet (Igra Caravel Testnet)
3. Complete reCAPTCHA
4. Mint tokens

## Important Notes

- Token IDs are hashed with `keccak256` when registering in the contract
- Frontend uses the same hashing for consistency
- Genesis page ID is generated automatically
- One page per token per wallet is enforced
