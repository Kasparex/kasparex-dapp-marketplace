# Vercel Deployment Checklist

## Quick Deploy Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your repository
5. Configure environment variables (see below)
6. Click "Deploy"

**Option B: Via Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel
```

### 3. Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

**Required:**
- `NEXT_PUBLIC_PINATA_API_KEY` = Your Pinata API Key
- `NEXT_PUBLIC_PINATA_API_SECRET` = Your Pinata API Secret

**Optional (for contract operations):**
- `PRIVATE_KEY` = Your deployer private key
- `KASPLEX_L2_TESTNET_RPC_URL` = Testnet RPC URL
- `KASPLEX_L2_MAINNET_RPC_URL` = Mainnet RPC URL

### 4. Test After Deployment

Visit your Vercel URL and test:
- ✅ Homepage loads
- ✅ `/test-ecosystem` page works
- ✅ Wallet connection works
- ✅ Contract addresses display correctly
- ✅ IPFS uploads work (if testing)

## Performance Optimizations Applied

- ✅ Reduced polling intervals from 30s to 60s
- ✅ Removed redundant polling in DAppWidgetHeader
- ✅ Progressive loading enabled
- ✅ Next.js automatic optimizations

## Troubleshooting

**Build fails:**
- Check environment variables are set
- Review build logs in Vercel dashboard

**Slow loading:**
- Check RPC endpoint responsiveness
- Verify contract addresses are correct
- Check browser console for errors

**Wallet connection issues:**
- Ensure correct network (Kasplex L2 Testnet: Chain ID 167012)
- Check RPC URL is accessible

## Next Steps After Deployment

1. Test all ecosystem components
2. Verify IPFS integration
3. Test dApp creation flow
4. Share URL with team for testing

