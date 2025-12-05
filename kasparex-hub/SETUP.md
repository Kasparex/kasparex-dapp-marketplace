# Kasparex Hub Setup Guide

## Step 1: Install Dependencies

```bash
cd kasparex-hub
npm install
```

## Step 2: Set Up Cloudflare Resources

### 2.1 Create KV Namespace

```bash
wrangler kv:namespace create "KASPAREX_CACHE"
```

This will output something like:
```
🌀  Creating namespace with title "kasparex-api-KASPAREX_CACHE"
✨  Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "KASPAREX_CACHE", id = "abc123def456..." }
```

**Copy the `id` value** and update `wrangler.toml` line 12.

### 2.2 Create D1 Database

```bash
wrangler d1 create kasparex-nodes
```

This will output something like:
```
✅ Successfully created DB 'kasparex-nodes'!

[[d1_databases]]
binding = "NODES_DB"
database_name = "kasparex-nodes"
database_id = "abc123def456..."
```

**Copy the `database_id` value** and update `wrangler.toml` line 18.

### 2.3 Create R2 Bucket

```bash
wrangler r2 bucket create kasparex-assets
```

This doesn't require an ID in `wrangler.toml` - it uses the bucket name.

## Step 3: Initialize D1 Database Schema

```bash
wrangler d1 execute kasparex-nodes --file=./workers/schema.sql
```

## Step 4: Set Cloudflare Secrets (Optional)

If you need to set secrets for the Workers:

```bash
# Registry CID (for IPFS registry)
wrangler secret put REGISTRY_CID

# Pinata API credentials (optional)
wrangler secret put PINATA_API_KEY
wrangler secret put PINATA_API_SECRET

# Storacha API key (optional)
wrangler secret put STORACHA_API_KEY
```

## Step 5: Update Environment Variables

Make sure your `.env.local` includes:

```env
# WalletConnect (required for EVM wallets)
WALLETCONNECT_PROJECT_ID=your_project_id_here

# Pinata IPFS (optional)
PINATA_API_KEY=your_pinata_key
PINATA_API_SECRET=your_pinata_secret

# Kasparex API URL (for local dev, use localhost)
KASPAREX_API_URL=http://localhost:8787
```

## Step 6: Test Locally

### 6.1 Start Remix Dev Server

```bash
npm run dev
```

This will start the Remix dev server on `http://localhost:5173` (or similar).

### 6.2 Test Workers Locally (Optional)

In a separate terminal:

```bash
npm run worker:dev
```

This will start the Cloudflare Worker locally on `http://localhost:8787`.

## Step 7: Build for Production

```bash
npm run build
```

## Step 8: Deploy to Cloudflare

### 8.1 Deploy Pages

1. Go to Cloudflare Dashboard → Pages
2. Create a new project
3. Connect your GitHub repository
4. Set build command: `npm run build`
5. Set output directory: `build/client`
6. Add environment variables from `.env.local`

### 8.2 Deploy Workers

```bash
npm run worker:deploy
```

Or deploy manually:
```bash
wrangler deploy
```

## Troubleshooting

### Issue: "KV namespace not found"
- Make sure you've created the KV namespace and updated `wrangler.toml` with the correct ID

### Issue: "D1 database not found"
- Make sure you've created the D1 database and updated `wrangler.toml` with the correct database_id
- Run the schema initialization: `wrangler d1 execute kasparex-nodes --file=./workers/schema.sql`

### Issue: "Module not found" errors
- Run `npm install` again
- Make sure you're using Node.js 20+

### Issue: WalletConnect not working
- Make sure `WALLETCONNECT_PROJECT_ID` is set in `.env.local`
- Get a project ID from https://cloud.walletconnect.com/

## Next Steps After Setup

1. ✅ Test wallet connections (Kasware, Kastle, EVM)
2. ✅ Test the Hub page loads correctly
3. ✅ Test mobile menu functionality
4. ✅ Verify Cloudflare Workers are responding
5. ✅ Test IPFS asset resolution
6. ✅ Deploy to production

