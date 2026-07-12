# API compatibility (Krex Node ↔ Kasparex Worker)

This package targets the **Kasparex Worker** routes under `/kasparex/node/*` as implemented in `workers/kasparex-api/nodes.ts` and `workers/kasparex-api/node-crypto.ts`.

## Base URLs

| Environment | Example |
|-------------|---------|
| Production | `https://kasparex-api.kasparexcom.workers.dev` |
| Local Wrangler | `http://127.0.0.1:8787` |

Set `apiBaseUrl` in `config.json` without a trailing slash.

## Mutating calls (register / ping)

When the Worker has stored `node:hmac:{nodeId}` in **KASPAREX_CACHE**, or when `KREX_NODE_REQUIRE_HMAC=true`, every **POST** body must be signed:

- `X-Krex-Timestamp`  -  Unix seconds (string)  
- `X-Krex-Nonce`  -  unique per request  
- `X-Krex-Signature`  -  lowercase hex **HMAC-SHA256**(secret, `` `${ts}.${nonce}.${sha256Hex(body)}` ``)

Clock skew allowed by the Worker: **120 seconds** (see `verifyNodeRequestHmac`).

## Optional hardening

- JSON `nonce`  -  deduplicated in KV when `RATE_LIMIT` is bound (`node:nonce:{nodeId}:{nonce}`, ~10m TTL).  
- JSON `seq`  -  must strictly increase vs `nodes.last_seq`.

## Read-only

- `GET /kasparex/node/runtime-config`  -  heartbeat bounds, `enrollmentEnabled`  
- `GET /kasparex/node/{id}/status`  -  online, uptime, epoch GRID snapshot fields  

## Mirror HTTP (krex-node `serve` / `mirror`)

When `role` is `mirror`, run `npm run mirror` and expose `servePort` (default 8788) via HTTPS at the `url` registered in the Worker.

The mirror serves the same read paths the Hub uses for node-first routing:

- `GET /health`
- `GET /kasparex/wallet/deck?address=...`
- `GET /kasparex/wallet/history?address=...`
- `GET /kasparex/stats`
- `GET /proxy/kasplex?endpoint=...` and `GET /proxy/krc721?endpoint=...`

Responses include `Access-Control-Allow-Origin: *` for browser clients.

## Versioning

Compare your `config.json` `version` field with `minNodeVersion` from `runtime-config` when the Worker starts publishing semver gates.
