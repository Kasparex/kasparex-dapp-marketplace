# Kasparex API - Cloudflare Workers

This directory contains the Cloudflare Workers implementation for the Kasparex API.

## Setup

### 1. Install Dependencies

```bash
cd workers
npm install
```

### 2. Create Cloudflare Resources

#### KV Namespaces

Create two KV namespaces in Cloudflare Dashboard:

1. **KASPAREX_CACHE** - For caching static data
   ```bash
   wrangler kv:namespace create "KASPAREX_CACHE"
   wrangler kv:namespace create "KASPAREX_CACHE" --preview
   ```

2. **RATE_LIMIT** - For rate limiting (optional)
   ```bash
   wrangler kv:namespace create "RATE_LIMIT"
   wrangler kv:namespace create "RATE_LIMIT" --preview
   ```

Update `wrangler.toml` with the namespace IDs.

#### D1 Database

Create D1 database:

```bash
wrangler d1 create kasparex-nodes
```

Update `wrangler.toml` with the database ID.

Initialize schema:

```bash
wrangler d1 execute kasparex-nodes --file=./schema.sql
```

### 3. Set Environment Variables

Set secrets via Wrangler:

```bash
wrangler secret put REGISTRY_CID
wrangler secret put PINATA_API_KEY  # Optional
wrangler secret put STORACHA_API_KEY  # Optional
```

Or set in Cloudflare Dashboard → Workers → Settings → Variables.

### 4. Local Development

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`.

### 5. Deploy

Deploy to production:

```bash
npm run deploy:production
```

Or deploy to preview:

```bash
npm run deploy:preview
```

## API Endpoints

### Node management (Krex Nodes)

- `POST /kasparex/node/challenge`  -  start wallet-binding challenge
- `POST /kasparex/node/verify-wallet`  -  verify Kaspa signature, returns short-lived enrollment token
- `POST /kasparex/node/enroll`  -  create node + HMAC secret in KV, bind wallet
- `POST /kasparex/node/rotate-secret`  -  rotate node HMAC (authenticated)
- `GET /kasparex/node/runtime-config`  -  min version, heartbeat hints for operator runtime
- `POST /kasparex/node/register`  -  register or refresh node row (HMAC when `node:hmac:{id}` exists in KV, or when `KREX_NODE_REQUIRE_HMAC=true`)
- `POST /kasparex/node/ping`  -  heartbeat; updates hourly `node_uptime_slices` (no per-ping row)
- `GET /kasparex/nodes`  -  list active nodes (compact)
- `GET /kasparex/node/:id`  -  node details
- `GET /kasparex/node/:id/status`  -  uptime, requests, version, flags
- `GET /kasparex/node/:id/rewards?epoch=YYYY-MM-DD`  -  epoch GRID row / preview
- `GET /kasparex/nodes/pinned/:cid`  -  find nodes pinning a CID

### Wallet + rewards

- `GET /kasparex/wallet/nodes?address=kaspa:...`  -  nodes owned by wallet
- `GET /kasparex/rewards/:nodeId?epoch=YYYY-MM-DD`  -  operator GRID for epoch (stored or preview)
- `GET /kasparex/rewards/epoch/:epochDate`  -  epoch summary

### Pts hub (redeemable points, `REWARDS_DB`)

Apply migration on `kasparex-rewards`:

```bash
wrangler d1 execute kasparex-rewards --file=./migrations/002_pts_hub.sql
```

**Networks (do not mix):** Kasplex L2 and Igra are different L2s in this repo.

| Chain | `VOUCHER_CHAIN_ID` | Example RPC for `IGRA_RPC_URL` |
|-------|--------------------|--------------------------------|
| **Igra Mainnet** (recommended for Kasparex rewards) | `38833` | `https://rpc.igralabs.com:8545` |
| Kasplex L2 mainnet | `202555` | `https://evmrpc.kasplex.org` |
| Kasplex L2 testnet | `167012` | `https://rpc.kasplextest.xyz` |

`IGRA_RPC_URL` is the JSON-RPC endpoint for the **same** chain as the vault (name is historical). If the vault is on Igra, the RPC must be Igra, not Kasplex.

Secrets / vars (Dashboard or `wrangler secret put` from `workers/`):

- `PTS_INGEST_SECRET`  -  header `X-Pts-Ingest-Secret` on `POST /kasparex/pts/ingest`
- `PTS_REDEEM_SECRET`  -  header `X-Pts-Redeem-Secret` on `POST /kasparex/pts/redeem` (`PTS_INGEST_SECRET` is used if unset)
- `VOUCHER_SIGNER_PRIVATE_KEY`  -  hex key matching `RewardsClaimVault` deploy `claimSigner`
- `REWARDS_CLAIM_VAULT_ADDRESS`  -  vault `0x…` on the L2 you chose
- `VOUCHER_CHAIN_ID`  -  must match that chain (e.g. `38833` for Igra Mainnet)
- `IGRA_RPC_URL`  -  HTTPS JSON-RPC on that same chain (see table)

**One-time setup checklist**

1. Generate or choose an EOA to be `claimSigner`. Its **private key** will be `VOUCHER_SIGNER_PRIVATE_KEY` (Worker secret only).
2. Deploy: `CLAIM_SIGNER=0xYourSigner npx hardhat run scripts/deploy-rewards-claim-vault.js --network igraMainnet` (use `igraMainnet` for Igra). Note printed `address` and `chainId`.
3. Cloudflare: Workers and Pages  -  open **kasparex-api** production  -  **Settings**  -  **Variables**  -  encrypt **Secrets** and add plain **Vars** as needed. Set `REWARDS_CLAIM_VAULT_ADDRESS`, `VOUCHER_CHAIN_ID`, `IGRA_RPC_URL`, `VOUCHER_SIGNER_PRIVATE_KEY`, `PTS_INGEST_SECRET`, `PTS_REDEEM_SECRET` to match step 2 and the table.
4. Vercel: Project  -  **Settings**  -  **Environment Variables** (Production). Set `NEXT_PUBLIC_KASPAREX_API_URL` or `KASPAREX_INTERNAL_API_URL` to your Worker base URL. Set `PTS_INGEST_SECRET` and `PTS_REDEEM_SECRET` to the **same** values as Cloudflare. Set `KASPAREX_PTS_INTERNAL_BEARER` to a new random string (only Next uses it for `Authorization: Bearer` on ingest/redeem API routes). Redeploy the Next app after saving.

If an older vault was deployed on Kasplex (`202555`) but you want Igra, deploy a **new** vault on `igraMainnet` and point Worker secrets at the new address and `38833` RPC. `claimSigner` cannot be changed on an existing contract.

Endpoints:

- `GET /kasparex/pts/balance?wallet=kaspa:…`
- `GET /kasparex/pts/history?wallet=…&limit=40`
- `POST /kasparex/pts/ingest`  -  JSON `{ wallet, delta_pts, source, idempotency_key, meta? }`
- `POST /kasparex/pts/redeem`  -  JSON `{ wallet_kaspa, evm_beneficiary, token_address, amount_wei, pts_spent, request_id? }`

Cron `15 3 * * *` runs archival of `pts_events` older than 180 days and writes a `pts_checkpoints` row.

Vercel (`NEXT_PUBLIC_KASPAREX_API_URL` or `KASPAREX_INTERNAL_API_URL`):

- `PTS_INGEST_SECRET` / `PTS_REDEEM_SECRET` must match Worker (for server-side proxies).
- `KASPAREX_PTS_INTERNAL_BEARER`  -  required `Authorization: Bearer …` on Next.js routes `/api/kasparex/pts/ingest` and `/api/kasparex/pts/redeem` (never expose to the browser).

### Public data

- `GET /kasparex/stats`  -  network statistics
- `GET /kasparex/network/stats`  -  alias including node aggregates where configured
- `GET /kasparex/dapps/availability?cid=...`  -  dApp mirror availability

### Health Check

- `GET /health` - Health check endpoint

## Rate Limiting

Rate limiting is enabled by default:
- **Limit**: 100 requests per minute per IP
- **Response**: 429 Too Many Requests with `Retry-After` header

To disable rate limiting, remove the `RATE_LIMIT` KV namespace from `wrangler.toml`.

## CORS

All endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Database schema

See `schema.sql` for the complete database schema. For existing deployments, apply `migrations/001_krex_nodes_v2.sql` once.

**Reward tier JSON:** `config/node-reward-tiers.json` drives role multipliers, region uplift, and settlement constants in the Worker. The Next.js app ships a duplicate at `src/config/node-reward-tiers.json` for UI copy; **keep both files identical** when tuning numbers. See also `config/reward_config.example.json`.

## Environment variables

- `REGISTRY_CID`  -  IPFS CID for registry (optional)
- `PINATA_API_KEY`  -  Pinata API key (optional)
- `STORACHA_API_KEY`  -  Storacha API key (optional)
- `KASPAREX_API_URL`  -  API base URL (optional)
- `NODE_ENROLLMENT_SECRET`  -  HS256 secret for enrollment / rotate-secret JWTs (required for enroll flows)
- `KREX_NODE_REQUIRE_HMAC`  -  set to `true` to reject register/ping without a KV HMAC secret

## Operator tooling

- Local crypto / reward golden vectors: `npm run test:krex-crypto` (from `workers/`, installs `tsx` as devDependency)
- First-node checklist (Wrangler, D1, KV, UI): `../docs/KREX_NODES_FIRST_NODE.md`
- Operator heartbeat client (reference): `../packages/krex-node`


