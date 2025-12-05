# Quick Start Guide

## ✅ Step 1: Dependencies Installed

Dependencies are now installed. Next steps:

## Step 2: Set Up Cloudflare Resources

### Option A: Set Up Now (Required for Full Functionality)

Run these commands to create Cloudflare resources:

```bash
# 1. Create KV Namespace for caching
wrangler kv:namespace create "KASPAREX_CACHE"

# 2. Create D1 Database for nodes and rewards
wrangler d1 create kasparex-nodes

# 3. Create R2 Bucket for asset storage
wrangler r2 bucket create kasparex-assets
```

**Important:** After running these commands, copy the IDs from the output and update `wrangler.toml`:
- Line 12: Replace `your-kv-namespace-id` with the KV namespace ID
- Line 18: Replace `your-d1-database-id` with the D1 database ID

### Option B: Test Locally First (Skip Cloudflare Setup)

You can test the frontend locally without Cloudflare resources. The Workers API won't work, but the UI will load.

## Step 3: Initialize Database (If you created D1)

```bash
wrangler d1 execute kasparex-nodes --file=./workers/schema.sql
```

## Step 4: Test Locally

### Start Development Server

```bash
npm run dev
```

This will start the Remix dev server. Open the URL shown in the terminal (usually `http://localhost:5173`).

### What to Test

1. ✅ Hub page loads
2. ✅ Mobile menu opens/closes
3. ✅ Wallet buttons appear (they won't connect without wallets installed)
4. ✅ Responsive design works on mobile/desktop

## Step 5: Environment Variables Check

Make sure your `.env.local` has at minimum:

```env
WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get a WalletConnect Project ID from: https://cloud.walletconnect.com/

## Troubleshooting

### "Cannot find module" errors
- Make sure you're in the `kasparex-hub` directory
- Try deleting `node_modules` and running `npm install` again

### Port already in use
- The dev server will try to use port 5173
- If it's taken, it will use the next available port

### TypeScript errors
- Run `npm run typecheck` to see detailed errors
- Most should be resolved after dependencies are installed

