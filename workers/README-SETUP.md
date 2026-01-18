# Quick Setup Guide

## Prerequisites

1. **Cloudflare Account**: Sign up at https://dash.cloudflare.com
2. **Wrangler CLI**: Install with `npm install -g wrangler`
3. **Authentication**: Run `wrangler login` to authenticate

## Step-by-Step Setup

### 1. Authenticate with Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate with Cloudflare.

### 2. Create D1 Database

**Option A: Use the setup script (recommended)**

```bash
# Linux/Mac
chmod +x setup.sh
./setup.sh

# Windows PowerShell
.\setup.ps1
```

**Option B: Manual setup**

```bash
# Create database
wrangler d1 create kasparex-rewards
```

This will output something like:
```
✅ Successfully created DB 'kasparex-rewards' in region APAC
Created your database using D1's new storage backend. The new storage backend is not yet recommended for production workloads, but backs up your data via snapshots to R2 daily.

[[d1_databases]]
binding = "REWARDS_DB"
database_name = "kasparex-rewards"
database_id = "abc123def456..."  # ← Copy this ID
```

**Update `wrangler.toml`** with the `database_id`:

```toml
[[d1_databases]]
binding = "REWARDS_DB"
database_name = "kasparex-rewards"
database_id = "abc123def456..."  # ← Paste the ID here
```

### 3. Initialize Database Schema

```bash
wrangler d1 execute kasparex-rewards --file=./schema-rewards.sql
```

### 4. Set Environment Variables (Optional)

```bash
# For IPFS archival (Storacha)
wrangler secret put STORACHA_API_KEY

# For manual archive endpoint authentication
wrangler secret put ARCHIVE_AUTH_TOKEN
```

When prompted, paste your API keys.

### 5. Deploy Cloudflare Workers

```bash
cd workers
npm install
wrangler deploy
```

This will output your Worker URL:
```
✨  Deployed kasparex-api version abc123
🌍  https://kasparex-api.your-subdomain.workers.dev
```

**Copy this URL** - you'll need it for the next step.

### 6. Configure Next.js Environment Variables

Add to your Vercel project (or `.env.local` for local development):

```bash
NEXT_PUBLIC_CLOUDFLARE_WORKER_URL=https://kasparex-api.your-subdomain.workers.dev
```

**In Vercel Dashboard:**
1. Go to your project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_CLOUDFLARE_WORKER_URL`
3. Set value to your Worker URL
4. Redeploy

### 7. Test the Setup

**Test reward recording:**
```bash
curl -X POST https://kasparex-api.your-subdomain.workers.dev/kasparex/rewards/l1/record \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "abc123def456...",
    "userAddress": "kaspa:qzy...",
    "dappId": "dao-voting",
    "actionType": "vote",
    "actionValue": 1.0,
    "network": "L1"
  }'
```

Expected response:
```json
{
  "success": true,
  "rewardId": "l1_1234567890_abc123"
}
```

**Test reward status:**
```bash
curl https://kasparex-api.your-subdomain.workers.dev/kasparex/rewards/l1/status/l1_1234567890_abc123
```

Expected response:
```json
{
  "status": "pending",
  "gridReward": null,
  "dAppTokenReward": null
}
```

## Verify Database

Check that tables were created:

```bash
wrangler d1 execute kasparex-rewards --command "SELECT name FROM sqlite_master WHERE type='table';"
```

You should see:
- `rewards_active`
- `rewards_archived`
- `user_reward_summary`

## Monitor Usage

1. **Cloudflare Dashboard** → Workers & Pages → Your Worker
2. **Analytics** tab → Monitor:
   - Requests (stay under 100k/day)
   - CPU time
   - Errors

3. **D1 Database** → Monitor:
   - Storage (stay under 5GB)
   - Reads (stay under 5M/month)

## Troubleshooting

### "Database not found"
- Check `wrangler.toml` has correct `database_id`
- Run `wrangler d1 list` to see all databases

### "KV namespace not found"
- KV namespaces are already configured in `wrangler.toml`
- If missing, run:
  ```bash
  wrangler kv:namespace create "KASPAREX_CACHE"
  wrangler kv:namespace create "RATE_LIMIT"
  ```

### "Cron job not running"
- Check `wrangler.toml` has `[triggers]` section
- Cron runs daily at 2 AM UTC
- Check Cloudflare Dashboard → Workers → Triggers

### "Archive failing"
- Verify `STORACHA_API_KEY` is set: `wrangler secret list`
- Test IPFS upload manually
- Check D1 database has space

## Next Steps

✅ Database created and schema initialized  
✅ Workers deployed  
✅ Environment variables configured  
✅ Endpoints tested  

You're ready to use the cost-effective architecture! 🎉
