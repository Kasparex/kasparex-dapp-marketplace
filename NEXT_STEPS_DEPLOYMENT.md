# 🚀 Next Steps: Deploy Promo Engine

## Step 1: Install Package (Run Locally)

The npm install command timed out. Please run this manually:

```bash
npm install
```

This will install:
- `react-google-recaptcha` (v3.1.0)
- `@types/react-google-recaptcha` (v1.1.3)

## Step 2: Verify Installation

After installation, verify the package is installed:

```bash
npm list react-google-recaptcha
```

You should see the package listed.

## Step 3: Push to Vercel

Once the package is installed, commit and push:

```bash
git add .
git commit -m "Add Promo Engine: minting, promotion, and revenue sharing system"
git push
```

Vercel will automatically build and deploy. The build should succeed.

## Step 4: Post-Deployment Configuration

After Vercel deployment, complete these steps:

### 4.1 Deploy Smart Contract (5 minutes)

```bash
npm run hardhat:deploy:promo-router
```

**Important:** Copy the deployed contract address from the output.

### 4.2 Set Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables:

Add these variables:

1. **NEXT_PUBLIC_PROMO_MINT_ROUTER_ADDRESS_IGRA_TESTNET**
   - Value: The contract address from step 4.1
   - Environment: Production, Preview, Development

2. **NEXT_PUBLIC_RECAPTCHA_SITE_KEY**
   - Value: Your Google reCAPTCHA Site Key
   - Get it from: https://www.google.com/recaptcha/admin
   - Environment: Production, Preview, Development

3. **NEXT_PUBLIC_KASPAREX_API_URL** (Optional)
   - Value: `https://kasparex-api.kasparexcom.workers.dev`
   - Or your custom API URL
   - Environment: Production, Preview, Development

After adding variables, **redeploy** the site (Vercel will auto-redeploy or trigger manually).

### 4.3 Initialize Database (2 minutes)

```bash
cd workers
wrangler d1 execute kasparex-nodes --file=./schema.sql
```

This creates all promo tables in Cloudflare D1.

### 4.4 Set Cloudflare Workers Secrets (2 minutes)

```bash
cd workers

# Set reCAPTCHA secret key
wrangler secret put RECAPTCHA_SECRET_KEY
# Paste your reCAPTCHA Secret Key when prompted

# Set admin token (generate a secure random token)
wrangler secret put ADMIN_AUTH_TOKEN
# Generate token: openssl rand -hex 32
# Paste the generated token when prompted
```

### 4.5 Deploy Workers (1 minute)

```bash
cd workers
wrangler deploy
```

### 4.6 Register First Token (5 minutes)

1. Create a `.env` file in the project root:

```env
PROMO_MINT_ROUTER_ADDRESS=0x... # From step 4.1
TOKEN_ADDRESS=0x... # Your DAppToken contract address
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
ADMIN_AUTH_TOKEN=your-admin-token-from-step-4.4
PRIVATE_KEY=your-deployer-private-key
```

2. Run the setup script:

```bash
npm run hardhat:setup:promo-token
```

This will:
- Register the token in the contract
- Create the token record in the database
- Create the genesis page

## Step 5: Test the System

1. Visit a token page: `/tokens/{token-slug}`
2. You should see the "Promotion Engine" section
3. Click "Mint and Promote" or "View Your Promo Page"
4. Test the minting flow with reCAPTCHA

## 📚 Reference Documentation

- `PROMO_ENGINE_DEPLOYMENT_CHECKLIST.md` - Detailed checklist
- `PROMO_ENGINE_QUICK_START.md` - Quick reference
- `PROMO_ENGINE_ENV_VARIABLES.md` - All environment variables
- `DEPLOYMENT_READY.md` - Status summary

## ⚠️ Important Notes

1. **reCAPTCHA Setup**: You need to register at https://www.google.com/recaptcha/admin first
   - Choose reCAPTCHA v2 ("I'm not a robot" checkbox)
   - Copy Site Key → Vercel env
   - Copy Secret Key → Cloudflare Workers secret

2. **Contract Deployment**: Make sure you have testnet KAS in your deployer wallet

3. **Database**: The schema includes all existing tables plus new promo tables

4. **Admin Token**: Keep the admin token secure - it's used for token registration

## ✅ Checklist

- [ ] Run `npm install` locally
- [ ] Push to Vercel
- [ ] Deploy contract
- [ ] Set Vercel environment variables
- [ ] Redeploy Vercel (to pick up env vars)
- [ ] Initialize database
- [ ] Set Cloudflare secrets
- [ ] Deploy workers
- [ ] Register first token
- [ ] Test the system

## 🎯 Current Status

✅ **Code**: 100% complete and ready
⏳ **Package Install**: Run `npm install` manually
⏳ **Deployment**: Ready to push to Vercel
⏳ **Configuration**: Complete after deployment

You're ready to proceed! Start with `npm install` and then push to Vercel.
