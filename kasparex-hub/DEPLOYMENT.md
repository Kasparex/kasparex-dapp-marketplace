# 🚀 Cloudflare Pages Deployment Guide

## Prerequisites

✅ Project builds successfully (`npm run build`)  
✅ GitHub repository created (optional, but recommended)  
✅ Cloudflare account  

## Step 1: Prepare for Deployment

### 1.1 Verify Build Output

Make sure the build completed successfully:

```bash
npm run build
```

You should see:
- ✅ `public/build/` directory with assets
- ✅ `build/index.js` (server bundle)
- ✅ No build errors

### 1.2 Create GitHub Repository (Recommended)

1. Go to GitHub and create a new repository named `kasparex-hub`
2. Initialize git in your project:

```bash
git init
git add .
git commit -m "Initial commit: Kasparex Hub on Remix + Cloudflare"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kasparex-hub.git
git push -u origin main
```

## Step 2: Deploy to Cloudflare Pages

### 2.1 Create Pages Project

1. Go to **Cloudflare Dashboard** → **Workers & Pages**
2. Click **Create application** → **Pages** → **Connect to Git**
3. Select your GitHub account and repository `kasparex-hub`
4. Click **Begin setup**

### 2.2 Configure Build Settings

**Project name**: `kasparex-hub` (or your preferred name)

**Build settings**:
- **Framework preset**: `Remix`
- **Build command**: `npm run build`
- **Build output directory**: `public`
- **Root directory**: `/` (leave empty)

**Environment variables** (add these):
- `NODE_VERSION`: `20`
- `WALLETCONNECT_PROJECT_ID`: (your WalletConnect project ID)

### 2.3 Deploy

Click **Save and Deploy**

The first deployment will:
- Install dependencies
- Run the build
- Deploy to Cloudflare Pages
- Give you a URL like `https://kasparex-hub.pages.dev`

## Step 3: Set Up Cloudflare Resources

### 3.1 Create KV Namespace

```bash
wrangler kv:namespace create "KASPAREX_CACHE"
```

Copy the `id` from the output and update `wrangler.toml` line 12.

### 3.2 Create D1 Database

```bash
wrangler d1 create kasparex-nodes
```

Copy the `database_id` from the output and update `wrangler.toml` line 18.

### 3.3 Initialize Database Schema

```bash
wrangler d1 execute kasparex-nodes --file=./workers/schema.sql
```

### 3.4 Create R2 Bucket

```bash
wrangler r2 bucket create kasparex-assets
```

No ID needed - uses bucket name.

### 3.5 Update wrangler.toml

After creating resources, update `wrangler.toml` with the actual IDs:
- Line 12: KV namespace ID
- Line 18: D1 database ID

## Step 4: Deploy Workers (Kasparex API)

### 4.1 Deploy Workers

```bash
wrangler deploy
```

This deploys the Kasparex API Workers.

### 4.2 Set Secrets (Optional)

If you need API keys:

```bash
wrangler secret put PINATA_API_KEY
wrangler secret put PINATA_API_SECRET
wrangler secret put STORACHA_API_KEY
wrangler secret put REGISTRY_CID
```

## Step 5: Configure Custom Domain (Optional)

1. Go to **Cloudflare Pages** → Your project → **Custom domains**
2. Add your domain: `hub.kasparex.com`
3. Cloudflare will automatically configure DNS

## Step 6: Verify Deployment

### Check Pages

1. Visit your Pages URL: `https://kasparex-hub.pages.dev`
2. Verify:
   - ✅ Hub page loads
   - ✅ Header and footer display
   - ✅ Mobile menu works
   - ✅ No console errors

### Check Workers

1. Test API endpoint: `https://kasparex-api.YOUR_SUBDOMAIN.workers.dev/health`
2. Should return: `{"status":"ok","timestamp":...}`

## Troubleshooting

### Build Fails

- Check build logs in Cloudflare Dashboard
- Verify `NODE_VERSION` is set to 20
- Check that all dependencies are in `package.json`

### 404 Errors

- Verify build output directory is `public`
- Check that `functions/[[path]].ts` exists
- Ensure Remix build completed successfully

### Workers Not Working

- Verify `wrangler.toml` has correct IDs
- Check that D1 database schema was initialized
- Verify Workers are deployed: `wrangler deploy`

## Next Steps After Deployment

1. ✅ Test all pages
2. ✅ Test wallet connections
3. ✅ Set up subdomains (hub, dapps, tokens, etc.)
4. ✅ Configure DNS records
5. ✅ Monitor performance and errors

## Production Checklist

- [ ] Pages deployed successfully
- [ ] Workers deployed successfully
- [ ] KV namespace created and linked
- [ ] D1 database created and initialized
- [ ] R2 bucket created
- [ ] Environment variables set
- [ ] Custom domain configured (if using)
- [ ] SSL certificate active
- [ ] All features tested
- [ ] Performance optimized

