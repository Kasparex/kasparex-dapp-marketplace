# Vercel Deployment Guide

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com
   - Sign in with your GitHub account

2. **Import Your Repository**
   - Click "Add New..." → "Project"
   - Select `Kasparex/kasparex-dapp-marketplace` repository
   - Click "Import"

3. **Configure Environment Variables**
   - In project settings, go to "Environment Variables"
   - Add the following (use testnet addresses for now):

   ```
   NEXT_PUBLIC_TREASURY_ADDRESS_TESTNET=0x305B4ee627aD8b12bFCF6427453964771aA30622
   NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS_TESTNET=0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2
   NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS_TESTNET=0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd
   NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS_TESTNET=0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85
   NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS_TESTNET=0xaC941a612b30Fe15F84a961a1FaCF2Ea5c2ef21E
   NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS_TESTNET=0x0530c962A17fB4602418087689e762e5989f1D43
   NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS_TESTNET=0x0F405c342e9596621430C5f888D673d40111a0ac
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   ```

4. **Build Settings**
   - Framework Preset: Next.js (should auto-detect)
   - Build Command: `pnpm build` (or `npm run build`)
   - Output Directory: `.next`
   - Install Command: `pnpm install` (or `npm install`)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live!

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not installed):
   ```bash
   pnpm add -g vercel
   # or
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_TREASURY_ADDRESS_TESTNET
   vercel env add NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS_TESTNET
   # ... add all other variables
   ```

5. **Redeploy**:
   ```bash
   vercel --prod
   ```

## Environment Variables for Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

### Testnet (Development)
```
NEXT_PUBLIC_TREASURY_ADDRESS_TESTNET=0x305B4ee627aD8b12bFCF6427453964771aA30622
NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS_TESTNET=0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2
NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS_TESTNET=0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd
NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS_TESTNET=0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85
NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS_TESTNET=0xaC941a612b30Fe15F84a961a1FaCF2Ea5c2ef21E
NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS_TESTNET=0x0530c962A17fB4602418087689e762e5989f1D43
NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS_TESTNET=0x0F405c342e9596621430C5f888D673d40111a0ac
```

### WalletConnect (Optional but Recommended)
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get your WalletConnect Project ID:
1. Visit https://cloud.walletconnect.com/
2. Create a new project or use existing
3. Copy the Project ID

## Important Notes

### ✅ Safe to Deploy
- Contract addresses (public)
- Network configuration
- Frontend code

### ❌ Never Deploy
- `.env` files (private keys)
- Deployment scripts with private keys
- Hardhat configuration with private keys

### Build Configuration

Vercel should auto-detect Next.js, but if needed:

**vercel.json** (optional):
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Check build logs in Vercel dashboard

### Environment Variables Not Working
- Make sure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding environment variables
- Check variable names match exactly

### Contract Addresses Not Loading
- Verify environment variables are set correctly
- Check network is Kasplex L2 Testnet
- Verify wallet is connected to correct network

## After Deployment

1. **Test the deployment**:
   - Visit your Vercel URL
   - Connect wallet to Kasplex L2 Testnet
   - Test SimplePayment widget
   - Test subscription features

2. **Set up custom domain** (optional):
   - Go to Vercel project settings
   - Add your custom domain

3. **Enable auto-deployments**:
   - Already enabled by default
   - Every push to main branch triggers deployment

## Production Deployment

For mainnet deployment:
1. Deploy contracts to mainnet first
2. Update environment variables with mainnet addresses
3. Redeploy on Vercel

---

**Your app will be live at**: `https://your-project-name.vercel.app`

