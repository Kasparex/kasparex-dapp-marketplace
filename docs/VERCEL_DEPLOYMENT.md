# Vercel Deployment Guide

This guide will help you deploy the Kasparex dApps Marketplace to Vercel for testing and production.

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier is sufficient)
3. **Environment Variables** - You'll need your Pinata API keys

## Step 1: Push to GitHub

If you haven't already, push your code to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

## Step 3: Configure Environment Variables

In the Vercel project settings, add these environment variables:

### Required Variables:
- `NEXT_PUBLIC_PINATA_API_KEY` - Your Pinata API Key
- `NEXT_PUBLIC_PINATA_API_SECRET` - Your Pinata API Secret

### Optional (if using Hardhat):
- `PRIVATE_KEY` - Your deployer private key (for contract deployment)
- `KASPLEX_L2_TESTNET_RPC_URL` - RPC URL for Kasplex L2 Testnet
- `KASPLEX_L2_MAINNET_RPC_URL` - RPC URL for Kasplex L2 Mainnet
- `ETHERSCAN_API_KEY` - For contract verification

## Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your application
3. You'll get a URL like: `https://your-project.vercel.app`

## Step 5: Test the Deployment

Once deployed, test these pages:
- `/` - Homepage
- `/dapps` - dApps listing
- `/test-ecosystem` - Ecosystem contracts test page
- `/test-ipfs` - IPFS integration test

## Performance Optimizations

The deployment includes:
- ✅ Automatic code splitting
- ✅ Image optimization
- ✅ Edge caching
- ✅ Progressive loading

## Troubleshooting

### Build Fails
- Check that all environment variables are set
- Review build logs in Vercel dashboard
- Ensure `package.json` has correct build scripts

### Runtime Errors
- Check browser console for errors
- Verify RPC endpoints are accessible
- Ensure contract addresses are correct in `src/lib/contracts/addresses.ts`

### Slow Loading
- Check network tab for slow API calls
- Verify RPC endpoints are responsive
- Consider reducing `refetchInterval` values in components

## Continuous Deployment

Vercel automatically deploys on every push to your main branch. You can also:
- Set up preview deployments for pull requests
- Configure custom domains
- Set up environment-specific variables (production, preview, development)

## Next Steps

After successful deployment:
1. Test all ecosystem contract integrations
2. Verify IPFS uploads work correctly
3. Test wallet connections on the deployed site
4. Share the URL for team testing

