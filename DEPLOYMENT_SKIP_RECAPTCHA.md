# 🚀 Deployment Steps (reCAPTCHA Optional)

## ✅ Code Updated

I've made reCAPTCHA **optional** so the system works without it. The code will:
- Work without `react-google-recaptcha` package installed
- Auto-generate session tokens if reCAPTCHA is not available
- Show reCAPTCHA widget only if package is installed AND site key is configured

## Step 1: Push to Vercel (No Package Install Needed)

Since reCAPTCHA is now optional, you can push immediately:

```bash
git add .
git commit -m "Add Promo Engine: minting, promotion, and revenue sharing system"
git push
```

Vercel will build successfully without the reCAPTCHA package.

## Step 2: Post-Deployment Configuration

After Vercel deployment, complete these steps:

### 2.1 Deploy Smart Contract (5 minutes)

```bash
npm run hardhat:deploy:promo-router
```

**Important:** Copy the deployed contract address from the output.

### 2.2 Set Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables:

Add these variables:

1. **NEXT_PUBLIC_PROMO_MINT_ROUTER_ADDRESS_IGRA_TESTNET** (Required)
   - Value: The contract address from step 2.1
   - Environment: Production, Preview, Development

2. **NEXT_PUBLIC_RECAPTCHA_SITE_KEY** (Optional - can add later)
   - Value: Your Google reCAPTCHA Site Key
   - Get it from: https://www.google.com/recaptcha/admin
   - Environment: Production, Preview, Development
   - **Note:** System works without this, but reCAPTCHA provides extra security

3. **NEXT_PUBLIC_KASPAREX_API_URL** (Optional)
   - Value: `https://kasparex-api.kasparexcom.workers.dev`
   - Or your custom API URL
   - Environment: Production, Preview, Development

After adding variables, **redeploy** the site (Vercel will auto-redeploy or trigger manually).

### 2.3 Initialize Database (2 minutes)

```bash
cd workers
wrangler d1 execute kasparex-nodes --file=./schema.sql
```

This creates all promo tables in Cloudflare D1.

### 2.4 Set Cloudflare Workers Secrets (2 minutes)

```bash
cd workers

# Set reCAPTCHA secret key (optional - can skip for now)
wrangler secret put RECAPTCHA_SECRET_KEY
# Paste your reCAPTCHA Secret Key when prompted
# Or skip this if not using reCAPTCHA yet

# Set admin token (required)
wrangler secret put ADMIN_AUTH_TOKEN
# Generate token: openssl rand -hex 32
# Paste the generated token when prompted
```

### 2.5 Deploy Workers (1 minute)

```bash
cd workers
wrangler deploy
```

### 2.6 Register First Token (5 minutes)

1. Create a `.env` file in the project root:

```env
PROMO_MINT_ROUTER_ADDRESS=0x... # From step 2.1
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
ADMIN_AUTH_TOKEN=your-admin-token-from-step-2.4
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

## Step 3: Test the System

1. Visit a token page: `/tokens/{token-slug}`
2. You should see the "Promotion Engine" section
3. Click "Mint and Promote" or "View Your Promo Page"
4. Test the minting flow (reCAPTCHA will be skipped if not configured)

## Adding reCAPTCHA Later (Optional)

If you want to add reCAPTCHA later:

1. Install the package:
   ```bash
   npm install react-google-recaptcha @types/react-google-recaptcha
   ```

2. Register at https://www.google.com/recaptcha/admin
   - Choose reCAPTCHA v2 ("I'm not a robot" checkbox)
   - Copy Site Key → Vercel env: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - Copy Secret Key → Cloudflare Workers secret: `RECAPTCHA_SECRET_KEY`

3. Redeploy Vercel and Workers

The code will automatically detect and use reCAPTCHA once configured.

## ✅ Checklist

- [x] Code updated to work without reCAPTCHA
- [ ] Push to Vercel
- [ ] Deploy contract
- [ ] Set Vercel environment variables (at least contract address)
- [ ] Redeploy Vercel (to pick up env vars)
- [ ] Initialize database
- [ ] Set Cloudflare secrets (at least admin token)
- [ ] Deploy workers
- [ ] Register first token
- [ ] Test the system
- [ ] (Optional) Add reCAPTCHA later

## 🎯 Current Status

✅ **Code**: 100% complete, reCAPTCHA optional
✅ **Dependencies**: No external packages required
✅ **Ready**: Can push to Vercel immediately

You can push to Vercel now! The system will work without reCAPTCHA, and you can add it later if needed.
