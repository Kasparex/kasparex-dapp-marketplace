# D1 Database Verification Guide

## How to Check if Rewards Were Recorded in Cloudflare D1

### Method 1: Using Wrangler CLI (Recommended)

#### Prerequisites
- Wrangler CLI installed and authenticated
- API token with D1:Edit permissions

#### Check Recent Rewards

```bash
# Navigate to workers directory
cd workers

# Query recent rewards (last 10)
wrangler d1 execute kasparex-rewards --remote --command "SELECT * FROM rewards_active ORDER BY created_at DESC LIMIT 10;"
```

#### Check Specific Transaction

```bash
# Replace YOUR_TX_HASH with actual transaction hash
wrangler d1 execute kasparex-rewards --remote --command "SELECT * FROM rewards_active WHERE tx_hash = 'YOUR_TX_HASH';"
```

#### Check by User Address

```bash
# Replace YOUR_ADDRESS with user's Kaspa address
wrangler d1 execute kasparex-rewards --remote --command "SELECT * FROM rewards_active WHERE user_address = 'YOUR_ADDRESS' ORDER BY created_at DESC LIMIT 10;"
```

#### Check Reward Status

```bash
# Check pending rewards
wrangler d1 execute kasparex-rewards --remote --command "SELECT id, status, grid_reward, dapp_token_reward, created_at FROM rewards_active WHERE status = 'pending';"

# Check completed rewards
wrangler d1 execute kasparex-rewards --remote --command "SELECT id, status, grid_reward, dapp_token_reward, distributed_at FROM rewards_active WHERE status = 'completed' ORDER BY distributed_at DESC LIMIT 10;"
```

#### Get Statistics

```bash
# Count total rewards
wrangler d1 execute kasparex-rewards --remote --command "SELECT COUNT(*) as total FROM rewards_active;"

# Count by status
wrangler d1 execute kasparex-rewards --remote --command "SELECT status, COUNT(*) as count FROM rewards_active GROUP BY status;"

# Count by dApp
wrangler d1 execute kasparex-rewards --remote --command "SELECT dapp_id, COUNT(*) as count FROM rewards_active GROUP BY dapp_id;"
```

### Method 2: Using Cloudflare Dashboard

1. **Go to Cloudflare Dashboard:**
   - https://dash.cloudflare.com

2. **Navigate to D1:**
   - Click **Workers & Pages** in sidebar
   - Click **D1** tab
   - Find **kasparex-rewards** database

3. **Query Database:**
   - Click on **kasparex-rewards** database
   - Click **Query** tab
   - Enter SQL query:
     ```sql
     SELECT * FROM rewards_active 
     ORDER BY created_at DESC 
     LIMIT 10;
     ```
   - Click **Run**

### Method 3: Using API Endpoint

You can also check reward status via the API:

```bash
# Get reward status by ID
curl "https://kasparex-api.kasparexcom.workers.dev/kasparex/rewards/l1/status/YOUR_REWARD_ID"
```

### Understanding the Data

#### rewards_active Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Unique reward ID (format: `l1_timestamp_txhash`) |
| `tx_hash` | TEXT | Original transaction hash |
| `user_address` | TEXT | User's Kaspa wallet address |
| `dapp_id` | TEXT | dApp identifier (e.g., 'dao-voting', 'simple-payment') |
| `action_type` | TEXT | Action type (e.g., 'vote', 'send-payment') |
| `action_value` | REAL | Action value in KAS |
| `grid_reward` | REAL | GRID token reward amount |
| `dapp_token_reward` | REAL | dApp token reward amount |
| `status` | TEXT | Status: 'pending', 'processing', 'completed', 'failed' |
| `network` | TEXT | Network: 'L1', 'L2', 'vProgs' |
| `created_at` | INTEGER | Unix timestamp when created |
| `updated_at` | INTEGER | Unix timestamp when last updated |
| `distributed_at` | INTEGER | Unix timestamp when reward was distributed (null if pending) |
| `ipfs_cid` | TEXT | IPFS CID if archived (null for active rewards) |

#### Example Query Results

```json
{
  "id": "l1_1768756806282_abc123def4567890",
  "tx_hash": "abc123def4567890123456789012345678901234567890123456789012345678",
  "user_address": "kaspa:qzy...",
  "dapp_id": "dao-voting",
  "action_type": "vote",
  "action_value": 1.0,
  "grid_reward": 0.5,
  "dapp_token_reward": 0.25,
  "status": "pending",
  "network": "L1",
  "created_at": 1768756806282,
  "updated_at": 1768756806282,
  "distributed_at": null,
  "ipfs_cid": null
}
```

### Troubleshooting

#### No Records Found

If you don't see any records:

1. **Check if transaction was successful:**
   - Verify transaction hash on Kaspa explorer
   - Confirm transaction was confirmed on-chain

2. **Check API logs:**
   - Go to Cloudflare Dashboard → Workers → kasparex-api
   - Check **Logs** tab for errors

3. **Verify environment variable:**
   - Ensure `NEXT_PUBLIC_CLOUDFLARE_WORKER_URL` is set in Vercel
   - Check browser console for API errors

#### Status Stuck on "pending"

If rewards are stuck on "pending":

1. **Check if reward distribution is implemented:**
   - L1 rewards require backend processing
   - Check Cloudflare Worker logs for errors

2. **Verify reward calculation:**
   - Check if `grid_reward` and `dapp_token_reward` are calculated
   - Review reward calculation logic

3. **Check for errors:**
   - Look for failed status records
   - Review error messages in database

### Quick Verification Script

Create a PowerShell script to quickly check rewards:

```powershell
# check-rewards.ps1
param(
    [string]$TxHash = "",
    [string]$UserAddress = "",
    [int]$Limit = 10
)

if ($TxHash) {
    wrangler d1 execute kasparex-rewards --remote --command "SELECT * FROM rewards_active WHERE tx_hash = '$TxHash';"
} elseif ($UserAddress) {
    wrangler d1 execute kasparex-rewards --remote --command "SELECT * FROM rewards_active WHERE user_address = '$UserAddress' ORDER BY created_at DESC LIMIT $Limit;"
} else {
    wrangler d1 execute kasparex-rewards --remote --command "SELECT * FROM rewards_active ORDER BY created_at DESC LIMIT $Limit;"
}
```

Usage:
```powershell
# Check by transaction hash
.\check-rewards.ps1 -TxHash "abc123..."

# Check by user address
.\check-rewards.ps1 -UserAddress "kaspa:qzy..."

# Check recent rewards
.\check-rewards.ps1 -Limit 20
```

---

**Database:** `kasparex-rewards`  
**Database ID:** `35760760-ee43-4ab4-b8c2-f9e134335acd`  
**Region:** EEUR (Eastern Europe)
