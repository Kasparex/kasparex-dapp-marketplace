# Setup In Progress

## Current Status

✅ Wrangler CLI installed  
⏳ Cloudflare authentication (requires manual step)  
⏳ D1 database creation  
⏳ Schema initialization  
⏳ Environment variables  
⏳ Worker deployment  

---

## Step 1: Authenticate with Cloudflare (MANUAL)

**You need to complete this step manually:**

1. Open your browser
2. Go to: https://dash.cloudflare.com/oauth2/auth?response_type=code&client_id=54d11594-84e4-41aa-b438-e81b8fa78ee7&redirect_uri=http%3A%2F%2Flocalhost%3A8976%2Foauth%2Fcallback&scope=account%3Aread%20user%3Aread%20workers%3Awrite%20workers_kv%3Awrite%20workers_routes%3Awrite%20workers_scripts%3Awrite%20workers_tail%3Aread%20d1%3Awrite%20pages%3Awrite%20zone%3Aread%20ssl_certs%3Awrite%20ai%3Awrite%20queues%3Awrite%20pipelines%3Awrite%20secrets_store%3Awrite%20containers%3Awrite%20cloudchamber%3Awrite%20connectivity%3Aadmin%20offline_access

**OR** run this command in a new terminal and complete the browser authentication:

```bash
wrangler login
```

After authentication, verify it worked:
```bash
wrangler whoami
```

You should see your Cloudflare account email.

---

## Step 2: Create D1 Database

Once authenticated, run:

```bash
cd workers
wrangler d1 create kasparex-rewards
```

**Important:** Copy the `database_id` from the output. It looks like:
```
database_id = "abc123def456..."
```

---

## Step 3: Update wrangler.toml

1. Open `workers/wrangler.toml`
2. Find the `REWARDS_DB` section (around line 27-30)
3. Replace `database_id = "TBD"` with your actual database ID:

```toml
[[d1_databases]]
binding = "REWARDS_DB"
database_name = "kasparex-rewards"
database_id = "YOUR_ACTUAL_DATABASE_ID_HERE"  # ← Paste your ID here
```

---

## Step 4: Initialize Database Schema

```bash
cd workers
wrangler d1 execute kasparex-rewards --file=./schema-rewards.sql
```

---

## Step 5: Set Environment Variables (Optional)

### Storacha API Key (for IPFS archival):
```bash
wrangler secret put STORACHA_API_KEY
```
Paste your Storacha API key when prompted. If you don't have one, you can skip this (IPFS will still work via public gateways).

### Archive Auth Token (for manual archive endpoint):
```bash
wrangler secret put ARCHIVE_AUTH_TOKEN
```
Generate a secure random token. You can use:
- PowerShell: `-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})`
- Or any password generator

---

## Step 6: Deploy Cloudflare Workers

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

## Step 7: Configure Next.js Environment Variables

### For Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Name:** `NEXT_PUBLIC_CLOUDFLARE_WORKER_URL`
   - **Value:** Your Cloudflare Worker URL (from Step 6)
   - **Environment:** Production, Preview, Development (select all)
4. Click **Save**
5. **Redeploy** your application

### For Local Development:

Add to `.env.local`:
```
NEXT_PUBLIC_CLOUDFLARE_WORKER_URL=https://kasparex-api.your-subdomain.workers.dev
```

---

## Step 8: Verify Setup

### Test Reward Recording:
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

Expected response:
```json
{
  "success": true,
  "rewardId": "l1_1234567890_abc123"
}
```

### Verify Database Tables:
```bash
wrangler d1 execute kasparex-rewards --command "SELECT name FROM sqlite_master WHERE type='table';"
```

You should see:
- `rewards_active`
- `rewards_archived`
- `user_reward_summary`

---

## Quick Command Reference

```bash
# Check authentication
wrangler whoami

# Create database
wrangler d1 create kasparex-rewards

# Initialize schema
wrangler d1 execute kasparex-rewards --file=./schema-rewards.sql

# Set secrets
wrangler secret put STORACHA_API_KEY
wrangler secret put ARCHIVE_AUTH_TOKEN

# Deploy
wrangler deploy

# List databases
wrangler d1 list

# List secrets
wrangler secret list
```

---

## Need Help?

- See `SETUP_NEXT_STEPS.md` for detailed instructions
- See `docs/COST_EFFECTIVE_SETUP.md` for architecture details
- Cloudflare Docs: https://developers.cloudflare.com/workers/

---

**Once you complete Step 1 (authentication), let me know and I can help automate the remaining steps!**
