# ⚡ Quick Deployment Guide

## Fastest Path to Deployment

### Option 1: Cloudflare Pages (Recommended)

1. **Push to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/kasparex-hub.git
   git push -u origin main
   ```

2. **Deploy via Cloudflare Dashboard**:
   - Go to: https://dash.cloudflare.com → Workers & Pages → Create application
   - Connect GitHub → Select `kasparex-hub` repository
   - **Build settings**:
     - Framework preset: `Remix`
     - Build command: `npm run build`
     - Build output directory: `public`
   - Click **Save and Deploy**

3. **Wait for deployment** (usually 2-5 minutes)

4. **Get your URL**: `https://kasparex-hub.pages.dev` (or your custom name)

### Option 2: Wrangler CLI

```bash
# Build first
npm run build

# Deploy Pages
wrangler pages deploy ./public --project-name=kasparex-hub

# Deploy Workers (separate)
wrangler deploy
```

## What Gets Deployed

✅ **Pages**: Frontend (Remix app) → `public/` directory  
✅ **Workers**: API (Kasparex API) → `workers/` directory  

## Environment Variables

Add these in Cloudflare Dashboard → Your project → Settings → Environment variables:

- `WALLETCONNECT_PROJECT_ID`: Your WalletConnect project ID
- `NODE_VERSION`: `20`

## After Deployment

1. Visit your Pages URL
2. Test the Hub page
3. Test wallet connections
4. Set up Cloudflare resources (KV, D1, R2) when ready

## Need Help?

See `DEPLOYMENT.md` for detailed instructions.

