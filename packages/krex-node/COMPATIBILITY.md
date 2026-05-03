# API compatibility (Krex Node ↔ Kasparex Worker)

This package targets the **Kasparex Worker** routes under `/kasparex/node/*` as implemented in `workers/kasparex-api/nodes.ts` and `workers/kasparex-api/node-crypto.ts`.

## Base URLs

| Environment | Example |
|-------------|---------|
| Local Wrangler | `http://127.0.0.1:8787` |
| Production | `https://api.kasparex.com` (or value shown in Kasparex docs) |

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

## Versioning

Compare your `config.json` `version` field with `minNodeVersion` from `runtime-config` when the Worker starts publishing semver gates.
