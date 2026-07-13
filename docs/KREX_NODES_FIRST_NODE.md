# Krex Nodes  -  first node checklist

Use this checklist when bringing up **Krex Nodes** (Kasparex operator layer) against a fresh or existing Cloudflare Worker + D1 stack, then validating the **Next.js** nodes dashboard.

## 1. Cloudflare resources

1. Install Wrangler and log in: `npm i -g wrangler` then `wrangler login`.
2. Create or attach **D1** `NODES_DB` (see `workers/wrangler.toml` binding name in your branch).
3. Apply schema:
   - New database: `wrangler d1 execute <DB_NAME> --file=workers/schema.sql`
   - Existing database with legacy columns: run `workers/migrations/001_krex_nodes_v2.sql` once (Wrangler `d1 execute`), then verify columns with a `SELECT`.
4. Create **KV** namespaces for `KASPAREX_CACHE` and (recommended) `RATE_LIMIT`; put IDs in `wrangler.toml`.
5. Set secrets / vars in the Worker dashboard or Wrangler:
   - `NODE_ENROLLMENT_SECRET`  -  required for challenge / verify / enroll / rotate-secret.
   - Optionally `KREX_NODE_REQUIRE_HMAC=true` once all nodes have enrolled secrets (legacy nodes without KV secret cannot ping until enrolled).

## 2. Local Worker

```bash
cd workers
npm install
npm run dev
```

Note the local origin (often `http://127.0.0.1:8787`).

## 3. Next.js app

Set `NEXT_PUBLIC_KASPAREX_API_URL` to the Worker origin above so `src/lib/api/client` and node hooks call your dev API.

```bash
npm install
npm run dev
```

Open the **Nodes** dashboard in the app; the network table should list nodes that have pinged within the last few minutes.

## 4. Enrollment and HMAC

1. `POST /kasparex/node/challenge`  -  receive `challengeId` + message to sign.
2. Sign the message with your Kaspa wallet (same pattern as other Kasparex flows).
3. `POST /kasparex/node/verify-wallet`  -  receive short-lived enrollment token.
4. `POST /kasparex/node/enroll`  -  receive `node_id` and **HMAC secret** (stored in KV under `node:hmac:{nodeId}`).

From then on, `POST /kasparex/node/register` and `POST /kasparex/node/ping` must include headers:

- `X-Krex-Timestamp`  -  Unix seconds  
- `X-Krex-Nonce`  -  unique string per request  
- `X-Krex-Signature`  -  hex HMAC-SHA256 of `${timestamp}.${nonce}.${sha256Hex(body)}` using the node secret  

Optional: `nonce` in JSON body plus `RATE_LIMIT` KV for replay rejection; monotonic `seq` in body when you want strict ordering.

## 5. Operator runtime

Use **`packages/krex-node`** in the [kasparex-dapp-marketplace](https://github.com/Kasparex/kasparex-dapp-marketplace) repo (`packages/krex-node`). A separate `kasparex-krex-node` repo is not published yet.

```bash
cd packages/krex-node
cp config.example.json config.json
# edit apiBaseUrl, nodeId, hmacSecret
npm install
npm run build
npm run heartbeat
```

Or under **pm2**: `pm2 start ecosystem.config.cjs`.

## 6. Verify data

- Worker: `GET /kasparex/node/{id}/status`  -  online flag, uptime, epoch GRID preview fields.
- D1: `SELECT * FROM nodes WHERE node_id = '...';` and `SELECT * FROM node_uptime_slices ORDER BY hour_ts DESC LIMIT 20;`
- Rewards: `GET /kasparex/rewards/{nodeId}?epoch=YYYY-MM-DD`  -  `final_grid` / `base_grid`.

## 7. Automated checks

From `workers/`:

```bash
npm run test:krex-crypto
```

Confirms HMAC canonical string and GRID preview golden vectors against `config/node-reward-tiers.json`.
