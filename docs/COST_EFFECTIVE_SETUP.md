# Cost-Effective Architecture Setup Guide

## Overview

This guide will help you set up a **$0-20/month** architecture that scales to millions of users using:
- ✅ Cloudflare D1 (FREE - 5GB storage, 5M reads/month)
- ✅ Cloudflare KV (FREE - 100k reads/day)
- ✅ Cloudflare Workers (FREE - 100k requests/day)
- ✅ IPFS/Storacha (FREE - decentralized storage)
- ✅ KREX Nodes (FREE - community-powered)

---

## Step 1: Create Cloudflare D1 Database

### Create the rewards database:

```bash
cd workers
wrangler d1 create kasparex-rewards
```

This will output a database ID. Copy it and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "REWARDS_DB"
database_name = "kasparex-rewards"
database_id = "YOUR_DATABASE_ID_HERE"  # Paste the ID from wrangler output
```

### Initialize the schema:

```bash
wrangler d1 execute kasparex-rewards --file=./schema-rewards.sql
```

---

## Step 2: Set Up Cloudflare KV (Already Done)

Your `wrangler.toml` already has KV namespaces configured:
- `KASPAREX_CACHE` - For caching reward data
- `RATE_LIMIT` - For rate limiting (optional)

No additional setup needed!

---

## Step 3: Configure Environment Variables

### Set secrets for Cloudflare Workers:

```bash
# Optional: For IPFS archival
wrangler secret put STORACHA_API_KEY

# Optional: For manual archive endpoint
wrangler secret put ARCHIVE_AUTH_TOKEN

# Optional: Pinata (if using paid gateway)
wrangler secret put PINATA_API_KEY
```

Or set in Cloudflare Dashboard → Workers → Settings → Variables.

---

## Step 4: Deploy Cloudflare Workers

```bash
cd workers
npm install
wrangler deploy
```

This deploys:
- ✅ L1 reward recording endpoint
- ✅ L1 reward status endpoint
- ✅ Archival cron job (runs daily at 2 AM UTC)
- ✅ Manual archive endpoint

---

## Step 5: Update Next.js API Routes

The Next.js API routes (`/api/rewards/l1/*`) should proxy to Cloudflare Workers:

```typescript
// In src/app/api/rewards/l1/record/route.ts
const cloudflareApiUrl = process.env.CLOUDFLARE_WORKER_URL || 'https://kasparex-api.your-subdomain.workers.dev';

// Proxy to Cloudflare Worker
const response = await fetch(`${cloudflareApiUrl}/kasparex/rewards/l1/record`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
```

Or update `src/lib/rewards/l1Distribution.ts` to call Cloudflare Workers directly.

---

## Step 6: Test the Setup

### Test reward recording:

```bash
curl -X POST https://kasparex-api.your-subdomain.workers.dev/kasparex/rewards/l1/record \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "abc123...",
    "userAddress": "kaspa:...",
    "dappId": "dao-voting",
    "actionType": "vote",
    "actionValue": 1.0,
    "network": "L1"
  }'
```

### Test reward status:

```bash
curl https://kasparex-api.your-subdomain.workers.dev/kasparex/rewards/l1/status/l1_1234567890_abc123
```

### Test manual archive (with auth token):

```bash
curl -X POST https://kasparex-api.your-subdomain.workers.dev/kasparex/rewards/archive \
  -H "Authorization: Bearer YOUR_ARCHIVE_AUTH_TOKEN"
```

---

## Step 7: Monitor Usage

### Check Cloudflare Dashboard:

1. **Workers** → Monitor request count (stay under 100k/day)
2. **D1** → Monitor storage (stay under 5GB)
3. **D1** → Monitor reads (stay under 5M/month)
4. **KV** → Monitor reads (stay under 100k/day)

### Optimization Tips:

- ✅ Archive old records daily (automatic via cron)
- ✅ Cache frequently accessed data (already implemented)
- ✅ Use KREX nodes for content delivery (reduces Vercel bandwidth)
- ✅ Batch operations when possible

---

## Cost Breakdown

| Service | Free Tier | Your Usage | Cost |
|---------|-----------|------------|------|
| Cloudflare Workers | 100k/day | ~10k/day | **$0** |
| Cloudflare D1 | 5GB, 5M reads | ~1GB, 500k reads | **$0** |
| Cloudflare KV | 100k reads/day | ~50k/day | **$0** |
| IPFS/Storacha | Unlimited | Unlimited | **$0** |
| KREX Nodes | Community | Community | **$0** |
| Pinata (optional) | - | - | **$20/mo** |

**Total: $0-20/month** ✅

---

## Architecture Flow

```
User Transaction
    ↓
Next.js API Route
    ↓
Cloudflare Worker (D1 + KV)
    ↓
Store in D1 (active)
    ↓
[After 7 days]
    ↓
Archive to IPFS
    ↓
Store CID in D1 (archived)
    ↓
Delete from active table
```

---

## Troubleshooting

### Database not found:
- Check `wrangler.toml` has correct database ID
- Run `wrangler d1 list` to see all databases

### KV namespace not found:
- Check `wrangler.toml` has correct KV namespace IDs
- Run `wrangler kv:namespace list` to see all namespaces

### Cron job not running:
- Check `wrangler.toml` has `[triggers]` section
- Verify cron syntax: `"0 2 * * *"` (daily at 2 AM UTC)

### Archive failing:
- Check STORACHA_API_KEY is set
- Verify IPFS upload is working
- Check D1 database has space

---

## Next Steps

1. ✅ Set up D1 database
2. ✅ Deploy Cloudflare Workers
3. ✅ Test endpoints
4. ✅ Monitor usage
5. ✅ Optimize as needed

You're now running a **cost-effective, scalable, decentralized** architecture! 🎉
