# Cloudflare Setup Guide

Complete step-by-step guide to set up Cloudflare Pages and Workers for Kasparex.

## Prerequisites

- Cloudflare account (free tier works)
- GitHub repository connected
- Node.js 18+ installed
- Wrangler CLI installed: `npm install -g wrangler`

## Step 1: Cloudflare Pages Setup

### 1.1 Connect GitHub Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **Create a project**
3. Click **Connect to Git**
4. Select your GitHub account
5. Choose repository: `kasparex-connect-wallet`
6. Click **Begin setup**

### 1.2 Configure Build Settings

```
Project name: kasparex-connect-wallet
Production branch: main
Framework preset: Next.js
Build command: npm run build:cloudflare
Build output directory: .next
Root directory: /
Node version: 18
```

**Important**: Use `npm run build:cloudflare` instead of `npm run build` to automatically clean cache files that exceed Cloudflare's 25 MiB file size limit.

**Alternative**: If you prefer to use `npm run build`, add a post-build step:
- Post-build command: `node scripts/clean-build-cache.js`

### 1.3 Add Environment Variables

In Cloudflare Pages dashboard, go to **Settings** → **Environment variables**:

**Production:**
```
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_key
NEXT_PUBLIC_PINATA_API_SECRET=your_pinata_secret
NEXT_PUBLIC_STORACHA_API_KEY=your_storacha_key (when you get it)
NEXT_PUBLIC_KASPAREX_API=https://kasparex-api.your-domain.workers.dev
REGISTRY_CID=your_registry_cid (after uploading)
```

**Preview:**
- Copy same variables for preview deployments

### 1.4 Custom Domain (Optional)

1. Go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain: `kasparex.com`
4. Cloudflare will auto-configure DNS
5. SSL certificates are automatic

## Step 2: Cloudflare Workers Setup

### 2.1 Create KV Namespace

1. Go to **Workers & Pages** → **KV**
2. Click **Create a namespace**
3. Name: `KASPAREX_CACHE`
4. Copy the **Namespace ID**

### 2.2 Create D1 Database

1. Go to **Workers & Pages** → **D1**
2. Click **Create database**
3. Name: `kasparex-nodes`
4. Copy the **Database ID**

### 2.3 Update wrangler.toml

Edit `wrangler.toml` and replace:
- `your-kv-namespace-id` with your actual KV namespace ID
- `your-d1-database-id` with your actual D1 database ID

### 2.4 Install Wrangler

```bash
npm install -g wrangler
# or
npm install --save-dev wrangler
```

### 2.5 Login to Cloudflare

```bash
wrangler login
```

This will open a browser to authenticate.

### 2.6 Set Secrets

```bash
# Set environment variables as secrets
wrangler secret put REGISTRY_CID
wrangler secret put PINATA_API_KEY
wrangler secret put STORACHA_API_KEY
```

### 2.7 Deploy Worker

```bash
cd workers
npm install
npm run deploy
```

Or from root:
```bash
npm run worker:deploy
```

## Step 3: Upload Assets to IPFS

### 3.1 Install Dependencies

```bash
npm install --save-dev tsx
```

### 3.2 Configure Pinata

Make sure you have:
- `NEXT_PUBLIC_PINATA_API_KEY` in `.env.local`
- `NEXT_PUBLIC_PINATA_API_SECRET` in `.env.local`

### 3.3 Upload Assets

```bash
# Dry run first (see what would be uploaded)
npm run upload:assets:dry

# Actually upload
npm run upload:assets

# Upload specific directory
npm run upload:assets -- --path public/img
```

This will:
1. Scan `public/` directory
2. Upload all images, JSON, etc. to Pinata
3. Generate `public/ipfs-asset-map.json` with CID mappings

### 3.4 Upload Registry

```bash
npm run upload:registry
```

This will:
1. Upload dApp registry to IPFS
2. Save CID to `.registry-cid`
3. Print URLs for verification

## Step 4: Update Configuration

### 4.1 Set Registry CID

After uploading registry, copy the CID and set it:

**In Cloudflare Pages:**
- Add `REGISTRY_CID` environment variable

**In Cloudflare Workers:**
```bash
wrangler secret put REGISTRY_CID
# Paste the CID when prompted
```

### 4.2 Update Code

Update your API routes to use the CID:

```typescript
// app/api/dapps/route.ts
const REGISTRY_CID = process.env.REGISTRY_CID || 'your-cid-here';
```

## Step 5: Test Deployment

### 5.1 Test Cloudflare Pages

1. Push to `main` branch
2. Cloudflare will auto-deploy
3. Check deployment status in dashboard
4. Visit your custom domain or `.pages.dev` URL

### 5.2 Test Cloudflare Workers

```bash
# Test locally
npm run worker:dev

# Test deployed worker
curl https://kasparex-api.your-username.workers.dev/api/dapps
```

### 5.3 Test IPFS Assets

Visit the Pinata URLs from the upload script to verify assets are accessible.

## Step 6: Keep Vercel for Testing

### 6.1 Vercel Configuration

Keep your Vercel project but:
- Remove production domain (point to Cloudflare)
- Keep preview deployments enabled
- Use for testing/PR previews only

### 6.2 Workflow

```
Development
    │
    ├─→ Push to feature branch
    │   └─→ Vercel creates preview URL
    │
    ├─→ Merge to main
    │   ├─→ Vercel deploys (for testing)
    │   └─→ Cloudflare deploys (production)
```

## Troubleshooting

### Build Fails on Cloudflare

- Check Node version (should be 18+)
- Verify build command: `npm run build`
- Check build output directory: `.next`

### Worker Not Working

- Verify KV namespace ID in `wrangler.toml`
- Check D1 database ID
- Verify secrets are set: `wrangler secret list`

### IPFS Assets Not Loading

- Verify Pinata API keys
- Check CID in asset map
- Test Pinata gateway URL directly
- Verify assets are pinned in Pinata dashboard

### Registry Not Found

- Verify `REGISTRY_CID` is set correctly
- Test CID with: `curl https://gateway.pinata.cloud/ipfs/YOUR_CID`
- Re-upload registry if needed

## Next Steps

1. ✅ Cloudflare Pages deployed
2. ✅ Workers deployed
3. ✅ Assets uploaded to IPFS
4. ✅ Registry uploaded
5. 🔄 Monitor costs and performance
6. 🔄 Optimize cache strategies
7. 🔄 Add more data to IPFS

## Cost Monitoring

Check Cloudflare dashboard regularly:
- **Pages**: Should be $0 (unlimited bandwidth)
- **Workers**: Monitor request counts
- **KV**: Monitor read/write operations
- **D1**: Should be $0 (free tier)

## Support

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)



