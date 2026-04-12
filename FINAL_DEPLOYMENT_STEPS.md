# 🚀 Final Deployment Steps

## ✅ Code Status: Ready to Deploy

All code is complete and reCAPTCHA is now optional. The system will work without the reCAPTCHA package.

## Step 1: Push to Vercel

You can push immediately - no package installation needed:

```bash
git add .
git commit -m "Add Promo Engine: minting, promotion, and revenue sharing system"
git push
```

Vercel will build successfully. The code handles missing reCAPTCHA gracefully.

## Step 2: Post-Deployment Setup

After Vercel deployment completes, follow these steps:

### 2.1 Deploy Smart Contract

```bash
npm run hardhat:deploy:promo-router
```

**Output will show:**
- Contract address (copy this!)
- Transaction hash
- Deployment file location

### 2.2 Configure Vercel Environment Variables

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

**Add these (minimum required):**

1. `NEXT_PUBLIC_PROMO_MINT_ROUTER_ADDRESS_IGRA_GALLEON_TESTNET`
   - Value: Contract address from step 2.1
   - Environments: Production, Preview, Development

**Optional (can add later):**

2. `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - Only needed if you want reCAPTCHA protection
   - Get from: https://www.google.com/recaptcha/admin

3. `NEXT_PUBLIC_KASPAREX_API_URL`
   - Default: `https://kasparex-api.kasparexcom.workers.dev`
   - Only needed if using custom API URL

**After adding variables, trigger a redeploy** (Vercel may auto-redeploy).

### 2.3 Initialize Database

```bash
cd workers
wrangler d1 execute kasparex-nodes --file=./schema.sql
```

This creates all promo tables in Cloudflare D1.

### 2.4 Set Cloudflare Workers Secrets

```bash
cd workers

# Required: Admin token for token registration
wrangler secret put ADMIN_AUTH_TOKEN
# Generate with: openssl rand -hex 32
# Paste the generated token

# Optional: reCAPTCHA secret (only if using reCAPTCHA)
wrangler secret put RECAPTCHA_SECRET_KEY
# Skip this if not using reCAPTCHA yet
```

### 2.5 Deploy Workers

```bash
cd workers
wrangler deploy
```

### 2.6 Register First Token

1. Create `.env` file in project root:

```env
PROMO_MINT_ROUTER_ADDRESS=0x... # From step 2.1
TOKEN_ADDRESS=0x... # Your DAppToken contract
TOKEN_ID=your-token-slug
TOKEN_TICKER=TOKEN
TOKEN_NAME=Your Token Name
MINT_PRICE=0.1
TOKENS_PER_MINT=1000
MINTABLE_SUPPLY=10000000
CREATOR_WALLET=0x...
PLATFORM_WALLET=0x...
GENESIS_SLOT1=0x...
GENESIS_SLOT2=0x...
GENESIS_SLOT3=0x...
GENESIS_SLOT4=0x...
GENESIS_SLOT5=0x...
KASPAREX_API_URL=https://kasparex-api.kasparexcom.workers.dev
ADMIN_AUTH_TOKEN=your-token-from-step-2.4
PRIVATE_KEY=your-deployer-private-key
```

2. Run setup:

```bash
npm run hardhat:setup:promo-token
```

## Step 3: Verify Deployment

1. Visit: `https://your-site.vercel.app/tokens/{token-slug}`
2. Check for "Promotion Engine" section
3. Click "Mint and Promote"
4. Verify promo page loads

## Quick Reference

- **Contract Deployment**: `npm run hardhat:deploy:promo-router`
- **Token Registration**: `npm run hardhat:setup:promo-token`
- **Database Init**: `cd workers && wrangler d1 execute kasparex-nodes --file=./schema.sql`
- **Workers Deploy**: `cd workers && wrangler deploy`

## ✅ Checklist

- [ ] Push to Vercel
- [ ] Deploy contract
- [ ] Set Vercel env vars (contract address)
- [ ] Initialize database
- [ ] Set Cloudflare secrets (admin token)
- [ ] Deploy workers
- [ ] Register first token
- [ ] Test the system

## 🎯 You're Ready!

**Push to Vercel now** - everything is set up to work without reCAPTCHA. You can add reCAPTCHA later if needed.
