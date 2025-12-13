# Deployment Next Steps

## ✅ Completed

1. **Cloudflare Resources Created**
   - ✅ KV Namespace: KASPAREX_CACHE
   - ✅ KV Namespace: RATE_LIMIT  
   - ✅ D1 Database: kasparex-nodes
   - ✅ Worker deployed: https://kasparex-api.kasparexcom.workers.dev

2. **Database Schema**
   - ⚠️ Schema executed locally (needs remote execution)

## 🔧 Remaining Steps

### 1. Initialize Remote Database Schema

Run this command to initialize the remote database:

```bash
cd workers
npx wrangler d1 execute kasparex-nodes --file=./schema.sql --remote
```

**Note**: This will make the database temporarily unavailable during execution.

### 2. Set Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following:

- **Variable**: `NEXT_PUBLIC_KASPAREX_API_URL`
- **Value**: `https://kasparex-api.kasparexcom.workers.dev`
- **Environment**: Production, Preview, Development (all)

### 3. Optional: Set Cloudflare Worker Secrets

If you need to use Pinata or Storacha APIs, set these secrets:

```bash
cd workers
npx wrangler secret put PINATA_API_KEY
npx wrangler secret put STORACHA_API_KEY
npx wrangler secret put REGISTRY_CID
```

### 4. Deploy to Vercel

Once environment variables are set:

1. Push your changes to GitHub (if using Git)
2. Vercel will automatically deploy, OR
3. Deploy manually via Vercel CLI:
   ```bash
   vercel --prod
   ```

### 5. Test the Deployment

After deployment, test these endpoints:

- **Health Check**: `https://kasparex-api.kasparexcom.workers.dev/health`
- **Stats**: `https://kasparex-api.kasparexcom.workers.dev/kasparex/stats`
- **Frontend**: Your Vercel deployment URL

## 📝 Worker URL

Your Cloudflare Worker is deployed at:
**https://kasparex-api.kasparexcom.workers.dev**

## 🔍 Testing Commands

Test the API locally:

```bash
# Health check
curl https://kasparex-api.kasparexcom.workers.dev/health

# Get stats
curl https://kasparex-api.kasparexcom.workers.dev/kasparex/stats

# Test from Next.js app (after setting env var)
# The app will use NEXT_PUBLIC_KASPAREX_API_URL
```

## 🎯 Next Actions

1. ✅ Worker deployed
2. ⏳ Initialize remote database schema
3. ⏳ Set Vercel environment variables
4. ⏳ Deploy to Vercel
5. ⏳ Test integration

## 📚 Documentation

- Worker API docs: See `workers/README.md`
- Migration summary: See `MIGRATION_SUMMARY.md`


