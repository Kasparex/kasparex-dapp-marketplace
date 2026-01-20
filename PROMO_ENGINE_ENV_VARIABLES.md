# Promo Engine Environment Variables

This document lists all environment variables required for the Promo Engine to function.

## Frontend (Vercel)

### Required
- `NEXT_PUBLIC_PROMO_MINT_ROUTER_ADDRESS_IGRA_TESTNET` - Deployed PromoMintRouter contract address on Igra Caravel Testnet
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` - Google reCAPTCHA v2/v3 Site Key

### Optional
- `NEXT_PUBLIC_KASPAREX_API_URL` - API base URL (defaults to `https://kasparex-api.kasparexcom.workers.dev`)

## Backend (Cloudflare Workers)

### Required
- `RECAPTCHA_SECRET_KEY` - Google reCAPTCHA Secret Key (matches Site Key)
- `ADMIN_AUTH_TOKEN` - Secure token for admin endpoints (generate with `openssl rand -hex 32`)

### Optional
- `IGRA_RPC_URL` - Igra testnet RPC URL for event indexing (defaults to `https://caravel.igralabs.com:8545`)

## Deployment Scripts (.env file)

### Required for `npm run hardhat:setup:promo-token`
- `PROMO_MINT_ROUTER_ADDRESS` - Deployed router address
- `TOKEN_ADDRESS` - DAppToken contract address
- `TOKEN_ID` - Token identifier/slug
- `TOKEN_TICKER` - Token ticker symbol
- `TOKEN_NAME` - Token full name
- `CREATOR_WALLET` - Token creator wallet address
- `PLATFORM_WALLET` - Kasparex platform wallet address
- `KASPAREX_API_URL` - API base URL
- `ADMIN_AUTH_TOKEN` - Admin token (must match Cloudflare Workers secret)

### Optional (with defaults)
- `MINT_PRICE` - Mint price in KAS (default: 0.1)
- `TOKENS_PER_MINT` - Tokens per mint (default: 1000)
- `MINTABLE_SUPPLY` - Total mintable supply (default: 10000000)
- `CREATOR_BPS` - Creator percentage in basis points (default: 4000 = 40%)
- `PLATFORM_BPS` - Platform percentage in basis points (default: 200 = 2%)
- `SLOT1_BPS` through `SLOT5_BPS` - Slot percentages (defaults: 40%, 10%, 5%, 2%, 1%)
- `GENESIS_SLOT1` through `GENESIS_SLOT5` - Genesis page slot wallets (defaults to deployer)
- `GENESIS_SLOT1_LABEL` through `GENESIS_SLOT5_LABEL` - Slot labels (optional)

### Required for Hardhat
- `PRIVATE_KEY` - Private key for contract deployment (must have testnet KAS)
- `IGRA_CARAVEL_TESTNET_RPC` - RPC URL (defaults to `https://caravel.igralabs.com:8545`)

## Setup Instructions

### 1. Get reCAPTCHA Keys
1. Visit https://www.google.com/recaptcha/admin
2. Register your site
3. Choose reCAPTCHA v2 ("I'm not a robot" checkbox) or v3 (invisible)
4. Copy Site Key → Vercel env: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
5. Copy Secret Key → Cloudflare Workers secret: `RECAPTCHA_SECRET_KEY`

### 2. Generate Admin Token
```bash
openssl rand -hex 32
```
Use this value for:
- Cloudflare Workers secret: `ADMIN_AUTH_TOKEN`
- `.env` file: `ADMIN_AUTH_TOKEN` (for setup scripts)

### 3. Set Vercel Environment Variables
Go to Vercel Dashboard → Project Settings → Environment Variables:
- `NEXT_PUBLIC_PROMO_MINT_ROUTER_ADDRESS_IGRA_TESTNET`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

### 4. Set Cloudflare Workers Secrets
```bash
cd workers
wrangler secret put RECAPTCHA_SECRET_KEY
wrangler secret put ADMIN_AUTH_TOKEN
```

### 5. Create .env File for Scripts
Create `.env` in project root with deployment script variables (see above).

## Security Notes

- Never commit `.env` files to git
- Admin token should be strong and kept secret
- reCAPTCHA keys are public (Site Key) and private (Secret Key)
- Private keys should be stored securely and never exposed
