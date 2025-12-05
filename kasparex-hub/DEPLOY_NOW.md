# 🚀 Deploy Now - Step by Step

## Step 1: Push to GitHub (5 minutes)

### 1.1 Initialize Git (if not done)

```bash
git init
git add .
git commit -m "Initial commit: Kasparex Hub on Remix + Cloudflare"
```

### 1.2 Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `kasparex-hub`
3. Description: "Kasparex Hub - Kaspa dApp Marketplace on Remix + Cloudflare"
4. Choose: Public or Private
5. **Don't** initialize with README (we already have one)
6. Click **Create repository**

### 1.3 Push Code

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kasparex-hub.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 2: Deploy to Cloudflare Pages (10 minutes)

### 2.1 Create Pages Project

1. Go to: https://dash.cloudflare.com
2. Click **Workers & Pages** (left sidebar)
3. Click **Create application**
4. Click **Pages** tab
5. Click **Connect to Git**

### 2.2 Connect Repository

1. Select your GitHub account
2. Authorize Cloudflare (if needed)
3. Select repository: `kasparex-hub`
4. Click **Begin setup**

### 2.3 Configure Build Settings

**Project name**: `kasparex-hub` (or your choice)

**Build settings**:
- **Framework preset**: Select `Remix` from dropdown
- **Build command**: `npm run build`
- **Build output directory**: `public`
- **Root directory**: `/` (leave empty)

### 2.4 Add Environment Variables

Click **Environment variables** → **Add variable**:

1. **Variable name**: `WALLETCONNECT_PROJECT_ID`
   - **Value**: (your WalletConnect project ID from https://cloud.walletconnect.com/)
   - **Environment**: Production, Preview, Development (check all)

2. **Variable name**: `NODE_VERSION`
   - **Value**: `20`
   - **Environment**: Production, Preview, Development (check all)

### 2.5 Deploy

1. Click **Save and Deploy**
2. Wait for build to complete (2-5 minutes)
3. You'll get a URL like: `https://kasparex-hub.pages.dev`

## Step 3: Test Deployment (2 minutes)

1. Open your Pages URL
2. Verify:
   - ✅ Hub page loads
   - ✅ Header with logo visible
   - ✅ Footer visible
   - ✅ No console errors (F12 → Console)

## Step 4: Deploy Workers API (Optional - Can do later)

### 4.1 Create Cloudflare Resources

```bash
# Create KV namespace
wrangler kv:namespace create "KASPAREX_CACHE"

# Create D1 database
wrangler d1 create kasparex-nodes

# Create R2 bucket
wrangler r2 bucket create kasparex-assets
```

### 4.2 Update wrangler.toml

Copy the IDs from the commands above and update:
- Line 17: KV namespace ID
- Line 23: D1 database ID

### 4.3 Initialize Database

```bash
wrangler d1 execute kasparex-nodes --file=./workers/schema.sql
```

### 4.4 Deploy Workers

```bash
wrangler deploy
```

## What You'll Have

✅ **Pages URL**: `https://kasparex-hub.pages.dev`  
✅ **Workers URL**: `https://kasparex-api.YOUR_SUBDOMAIN.workers.dev`  

## Next Steps (After Deployment)

1. ✅ Test all features
2. ✅ Set up custom domain (hub.kasparex.com)
3. ✅ Configure subdomains
4. ✅ Set up Cloudflare resources (KV, D1, R2)
5. ✅ Deploy Workers API

## Quick Reference

**Pages Deployment**: Done via Cloudflare Dashboard (Git integration)  
**Workers Deployment**: Done via `wrangler deploy` command  
**Build Output**: `public/` directory  
**Functions**: `functions/[[path]].ts`  

## Need Help?

- See `DEPLOYMENT.md` for detailed guide
- See `DEPLOYMENT_CHECKLIST.md` for checklist
- Check Cloudflare Dashboard for build logs

