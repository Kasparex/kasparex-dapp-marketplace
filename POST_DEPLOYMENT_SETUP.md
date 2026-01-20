# 🚀 Post-Deployment Setup Guide

## ✅ Status: Vercel Deployment Complete

The frontend code has been successfully deployed to Vercel. Now complete these steps to enable full functionality:

---

## Step 1: Deploy Smart Contract ⏳

### Prerequisites
1. Create a `.env` file in the project root (if it doesn't exist)
2. Add your deployer wallet private key:

```env
PRIVATE_KEY=your_private_key_here
IGRA_CARAVEL_TESTNET_RPC=https://caravel.igralabs.com:8545
```

**⚠️ Security Note:** Never commit `.env` to git. It should already be in `.gitignore`.

### Deploy Contract

```bash
npm run hardhat:deploy:promo-router
```

**Expected Output:**
```
PromoMintRouter deployed to: 0x...
```

**📝 Copy the deployed address** - you'll need it for the next step.

---

## Step 2: Configure Vercel Environment Variables ⏳

1. Go to: [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

2. Add this variable:

   - **Name:** `NEXT_PUBLIC_PROMO_MINT_ROUTER_ADDRESS_IGRA_TESTNET`
   - **Value:** The contract address from Step 1
   - **Environments:** Production, Preview, Development

3. **Trigger a redeploy** (Vercel may auto-redeploy, or manually trigger from Deployments tab)

---

## Step 3: Initialize Cloudflare D1 Database ⏳

```bash
cd workers
wrangler d1 execute kasparex-nodes --file=./schema.sql
```

This creates all promo tables:
- `promo_tokens`
- `promo_pages`
- `promo_mint_events`
- `promo_rate_limiting`
- `promo_recaptcha_verifications`

**Note:** The database `kasparex-nodes` is already configured in `wrangler.toml` with ID: `ec15da5c-133a-4735-9cd6-afde1377577a`

---

## Step 4: Set Cloudflare Workers Secrets ⏳

```bash
cd workers

# Required: Admin token for token registration
wrangler secret put ADMIN_AUTH_TOKEN
# When prompted, paste a secure random token
# Generate one with: openssl rand -hex 32

# Optional: reCAPTCHA secret (skip if not using reCAPTCHA)
wrangler secret put RECAPTCHA_SECRET_KEY
# Only needed if you want reCAPTCHA protection
```

**📝 Save the ADMIN_AUTH_TOKEN** - you'll need it for token registration.

---

## Step 5: Deploy Cloudflare Workers ⏳

```bash
cd workers
wrangler deploy
```

**Expected Output:**
```
✨  Deployed kasparex-api version abc123
🌍  https://kasparex-api.kasparexcom.workers.dev
```

---

## Step 6: Register First Token ⏳

### Create `.env` file with token configuration:

```env
# Contract addresses
PROMO_MINT_ROUTER_ADDRESS=0x... # From Step 1
TOKEN_ADDRESS=0x... # Your DAppToken contract address

# Token configuration
TOKEN_ID=your-token-slug
TOKEN_TICKER=TOKEN
TOKEN_NAME=Your Token Name
MINT_PRICE=0.1
TOKENS_PER_MINT=1000
MINTABLE_SUPPLY=10000000

# Wallets
CREATOR_WALLET=0x... # Token creator
PLATFORM_WALLET=0x... # Kasparex platform wallet

# Genesis page slots (5 wallets for revenue sharing)
GENESIS_SLOT1=0x...
GENESIS_SLOT2=0x...
GENESIS_SLOT3=0x...
GENESIS_SLOT4=0x...
GENESIS_SLOT5=0x...

# API configuration
KASPAREX_API_URL=https://kasparex-api.kasparexcom.workers.dev
ADMIN_AUTH_TOKEN=your-token-from-step-4

# Network (already set)
PRIVATE_KEY=your_private_key_here
IGRA_CARAVEL_TESTNET_RPC=https://caravel.igralabs.com:8545
```

### Run Setup Script:

```bash
npm run hardhat:setup:promo-token
```

This script will:
1. Register the token in the `PromoMintRouter` contract
2. Create the token record in D1 database
3. Create the genesis page in D1 database

---

## Step 7: Verify Deployment ✅

1. Visit: `https://your-site.vercel.app/tokens/{TOKEN_ID}`
2. Check for "Promotion Engine" section
3. Click "Mint and Promote" or visit: `/tokens/{TOKEN_ID}/promo/{genesis_page_id}`
4. Connect wallet (Igra Caravel Testnet)
5. Test minting flow

---

## 📋 Quick Checklist

- [ ] Step 1: Deploy contract (requires PRIVATE_KEY)
- [ ] Step 2: Set Vercel env var (contract address)
- [ ] Step 3: Initialize database
- [ ] Step 4: Set Cloudflare secrets (ADMIN_AUTH_TOKEN)
- [ ] Step 5: Deploy workers
- [ ] Step 6: Register first token
- [ ] Step 7: Test the system

---

## 🔧 Troubleshooting

### "Cannot read properties of undefined (reading 'address')"
- **Solution:** Add `PRIVATE_KEY` to your `.env` file

### "Database not found"
- **Solution:** Verify `wrangler.toml` has the correct `database_id` for `kasparex-nodes`

### "Secret not found"
- **Solution:** Run `wrangler secret put ADMIN_AUTH_TOKEN` in the `workers` directory

### Contract deployment fails
- **Solution:** Ensure you have KAS in your deployer wallet on Igra Caravel Testnet

---

## 🎯 Next Steps After Setup

Once all steps are complete:
1. Test the minting flow end-to-end
2. Verify revenue sharing works correctly
3. Test cooldown and rate limiting
4. (Optional) Configure reCAPTCHA if desired

---

**Ready to start? Begin with Step 1!** 🚀
