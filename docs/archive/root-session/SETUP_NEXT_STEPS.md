# Next Steps: Cost-Effective Architecture Setup

## Quick Start Guide

Follow these steps to set up your cost-effective decentralized architecture.

---

## Step 1: Install Prerequisites

### Install Wrangler CLI (if not already installed)

```bash
npm install -g wrangler
```

### Authenticate with Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate with Cloudflare.

---

## Step 2: Create D1 Database

### Option A: Use Setup Script (Recommended)

**Windows (PowerShell):**
```powershell
cd workers
.\setup.ps1
```

**Linux/Mac:**
```bash
cd workers
chmod +x setup.sh
./setup.sh
```

### Option B: Manual Setup

1. **Create the database:**
   ```bash
   cd workers
   wrangler d1 create kasparex-rewards
   ```

2. **Copy the database ID** from the output (looks like `abc123def456...`)

3. **Update `wrangler.toml`:**
   - Open `workers/wrangler.toml`
   - Find the `REWARDS_DB` section
   - Replace `database_id = "TBD"` with your actual database ID:
     ```toml
     [[d1_databases]]
     binding = "REWARDS_DB"
     database_name = "kasparex-rewards"
     database_id = "YOUR_ACTUAL_DATABASE_ID_HERE"
     ```

4. **Initialize the schema:**
   ```bash
   wrangler d1 execute kasparex-rewards --file=./schema-rewards.sql
   ```

---

## Step 3: Set Environment Variables (Optional but Recommended)

### Set Storacha API Key (for IPFS archival)

```bash
wrangler secret put STORACHA_API_KEY
```

When prompted, paste your Storacha API key. If you don't have one, you can skip this (IPFS will still work via public gateways).

### Set Archive Auth Token (for manual archive endpoint)

```bash
wrangler secret put ARCHIVE_AUTH_TOKEN
```

Generate a secure random token (you can use: `openssl rand -hex 32` or any password generator).

---

## Step 4: Deploy Cloudflare Workers

```bash
cd workers
npm install
wrangler deploy
```

**Important:** Copy the Worker URL from the output. It will look like:
```
🌍  https://kasparex-api.your-subdomain.workers.dev
```

---

## Step 5: Configure Next.js Environment Variables

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name:** `NEXT_PUBLIC_CLOUDFLARE_WORKER_URL`
   - **Value:** Your Cloudflare Worker URL (from Step 4)
   - **Environment:** Production, Preview, Development (select all)
4. Click **Save**
5. **Redeploy** your application

### For Local Development:

Create or update `.env.local`:

```bash
NEXT_PUBLIC_CLOUDFLARE_WORKER_URL=https://kasparex-api.your-subdomain.workers.dev
```

---

## Step 6: Verify Setup

### Test Reward Recording Endpoint

```bash
curl -X POST https://kasparex-api.your-subdomain.workers.dev/kasparex/rewards/l1/record \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "abc123def4567890123456789012345678901234567890123456789012345678",
    "userAddress": "kaspa:qzy...",
    "dappId": "dao-voting",
    "actionType": "vote",
    "actionValue": 1.0,
    "network": "L1"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "rewardId": "l1_1234567890_abc123"
}
```

### Test Reward Status Endpoint

```bash
curl https://kasparex-api.your-subdomain.workers.dev/kasparex/rewards/l1/status/l1_1234567890_abc123
```

**Expected Response:**
```json
{
  "status": "pending",
  "gridReward": null,
  "dAppTokenReward": null
}
```

### Verify Database Tables

```bash
wrangler d1 execute kasparex-rewards --command "SELECT name FROM sqlite_master WHERE type='table';"
```

You should see:
- `rewards_active`
- `rewards_archived`
- `user_reward_summary`

---

## Step 7: Monitor Usage

### Cloudflare Dashboard

1. Go to **Workers & Pages** → Your Worker
2. Check **Analytics** tab:
   - **Requests:** Should stay under 100k/day (free tier)
   - **CPU Time:** Monitor for performance
   - **Errors:** Should be minimal

3. Go to **D1** → Your Database:
   - **Storage:** Should stay under 5GB (free tier)
   - **Reads:** Should stay under 5M/month (free tier)

### Set Up Alerts (Optional)

In Cloudflare Dashboard, you can set up alerts for:
- High request count (>80k/day)
- High storage usage (>4GB)
- High read count (>4M/month)

---

## Troubleshooting

### Issue: "Database not found"

**Solution:**
- Verify `wrangler.toml` has the correct `database_id`
- Run `wrangler d1 list` to see all your databases
- Make sure you're in the correct Cloudflare account

### Issue: "KV namespace not found"

**Solution:**
- KV namespaces are already configured in `wrangler.toml`
- If you get this error, the namespaces might need to be recreated:
  ```bash
  wrangler kv:namespace create "KASPAREX_CACHE"
  wrangler kv:namespace create "RATE_LIMIT"
  ```
- Update `wrangler.toml` with the new namespace IDs

### Issue: "Cron job not running"

**Solution:**
- Verify `wrangler.toml` has the `[triggers]` section:
  ```toml
  [triggers]
  crons = ["0 2 * * *"]
  ```
- Check Cloudflare Dashboard → Workers → Triggers
- Cron runs daily at 2 AM UTC

### Issue: "Archive failing"

**Solution:**
- Check if `STORACHA_API_KEY` is set: `wrangler secret list`
- Test IPFS upload manually
- Verify D1 database has available space
- Check Cloudflare Worker logs for errors

---

## What Happens Next?

### Automatic Processes:

1. **Daily Archival (2 AM UTC):**
   - Old rewards (>7 days) are archived to IPFS
   - Database storage is reduced by 90%+
   - Full records are stored on IPFS, only CIDs in database

2. **Caching:**
   - Reward status is cached for 10 minutes
   - User summaries are cached for 1 hour
   - Reduces database queries significantly

3. **Content Delivery:**
   - KREX nodes serve IPFS content (free, community-powered)
   - Fallback to Storacha, IPFS gateways, Cloudflare CDN

### Manual Operations:

- **Manual Archive:** `POST /kasparex/rewards/archive` (requires auth token)
- **Monitor Usage:** Check Cloudflare Dashboard regularly
- **Optimize:** Adjust cache TTLs if needed

---

## Cost Monitoring

### Free Tier Limits:

| Service | Free Limit | Your Current Usage | Status |
|---------|-----------|-------------------|--------|
| Cloudflare Workers | 100k/day | ~0/day | ✅ Safe |
| Cloudflare D1 | 5GB storage | ~0GB | ✅ Safe |
| Cloudflare D1 | 5M reads/month | ~0/month | ✅ Safe |
| Cloudflare KV | 100k reads/day | ~0/day | ✅ Safe |

### Optimization Tips:

- ✅ Archive old data daily (automatic)
- ✅ Cache frequently accessed data (implemented)
- ✅ Use KREX nodes for content (reduces Vercel bandwidth)
- ✅ Monitor usage weekly

---

## Success Checklist

- [ ] D1 database created and schema initialized
- [ ] `wrangler.toml` updated with database ID
- [ ] Environment variables set (STORACHA_API_KEY, ARCHIVE_AUTH_TOKEN)
- [ ] Cloudflare Workers deployed
- [ ] Worker URL copied and added to Vercel env vars
- [ ] Next.js app redeployed with new env vars
- [ ] Test endpoints working
- [ ] Database tables verified
- [ ] Monitoring set up in Cloudflare Dashboard

---

## Need Help?

- **Documentation:** See `docs/COST_EFFECTIVE_SETUP.md`
- **Setup Scripts:** Use `workers/setup.sh` or `workers/setup.ps1`
- **Cloudflare Docs:** https://developers.cloudflare.com/workers/
- **D1 Docs:** https://developers.cloudflare.com/d1/

---

**You're all set!** Your architecture is now cost-effective and ready to scale! 🎉
