# Krex Node (operator runtime)

Small **Node.js 20+** process for Kasparex Krex Nodes: signed **heartbeats**, optional **IPFS pin cache**, and optional **read-only edge HTTP**.

**Install location:** `packages/krex-node` in [kasparex-dapp-marketplace](https://github.com/Kasparex/kasparex-dapp-marketplace) (not a separate repo).

## Quick start (light node: heartbeat only)

```bash
cp config.example.json config.json
# Edit apiBaseUrl, nodeId, hmacSecret from enroll.
npm install
npm run build
npm run once
npm run light
```

## Edge node (HTTP + heartbeat)

Test locally on `http://localhost:8788`, then expose **public HTTPS** and enroll on the Hub with role **edge**.

Set `"role": "edge"` and your public HTTPS `"url"` in `config.json` (reverse proxy to `servePort`, default 8788).

```bash
npm run build
npm run edge
```

Or under **pm2**:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 logs krex-node-edge
```

**Auto-start after reboot** (run once per machine):

```bash
# Windows — plain pm2 startup does NOT work; use the script
scripts\pm2-boot-setup.bat

# Linux / macOS
sh scripts/pm2-boot-setup.sh
```

## Commands

| Command | Description |
|--------|-------------|
| `once` | Single ping |
| `heartbeat` | Loop on `heartbeatIntervalSec` |
| `status` | Print `runtime-config` + node status |
| `serve` | Read-only edge HTTP only (no heartbeat) |
| `edge` | Edge HTTP + heartbeat + pin sync (recommended) |
| `light` | Heartbeat + IPFS pin sync only (no HTTP) |
| `pin-sync` | One-shot download of catalog CIDs to local cache |
| `pin-status` | Show locally warmed CIDs |

Legacy: `npm run mirror` runs the same as `edge` (deprecated name).

Override config path: `KREX_NODE_CONFIG=/path/to/config.json`.

## IPFS pin cache (light / edge)

Light and edge nodes can **warm** Hub catalog CIDs into a local folder (default `.krex-pin-cache/`):

1. Worker `GET /kasparex/node/runtime-config` returns `pinCatalog.recommendedCids`.
2. Add manual CIDs in `config.json` under `pinnedCids`.
3. `pin-sync` or the automatic loop (every `pinSyncIntervalSec`, default 6h) fetches from public gateways.
4. Heartbeats report the merged list as `pinned_cids`.
5. Edge nodes serve warmed objects at `GET /ipfs/{cid}`.

| Path | Behavior |
|------|----------|
| `GET /health` | Node health + cache stats |
| `GET /ipfs/{cid}` | Locally warmed IPFS object (if pin sync ran) |
| `GET /kasparex/*` | Pass-through to `apiBaseUrl` with local cache |
| `GET /proxy/kasplex?endpoint=/v1/...` | Worker kasplex proxy |
| `GET /proxy/krc721?endpoint=/api/v1/...` | Worker KRC721 proxy |

The Kasparex Hub uses node-first routing: it tries enrolled edge nodes before falling back to the central Worker.

See **COMPATIBILITY.md** for API base URLs and HMAC headers.

Operator docs: **[docs/KREX_NODE_OPERATOR_GUIDE.md](../../docs/KREX_NODE_OPERATOR_GUIDE.md)**, **[docs/KREX_NODE_QUICKSTART.md](../../docs/KREX_NODE_QUICKSTART.md)**, **[docs/KREX_NODE_PUBLIC_EDGE.md](../../docs/KREX_NODE_PUBLIC_EDGE.md)**.
