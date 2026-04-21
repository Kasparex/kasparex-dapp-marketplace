# Krex Node (operator runtime)

Small **Node.js 20+** process that sends signed **heartbeats** to the Kasparex Worker (`POST /kasparex/node/ping`) using the same HMAC scheme as `workers/kasparex-api/node-crypto.ts`.

## Quick start

```bash
cp config.example.json config.json
# Edit apiBaseUrl (e.g. http://127.0.0.1:8787), nodeId, hmacSecret from enroll.
npm install
npm run build
npm run once
npm run heartbeat
```

## pm2

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 logs krex-node
```

## Commands

| Command | Description |
|--------|-------------|
| `once` | Single ping |
| `heartbeat` | Loop on `heartbeatIntervalSec` |
| `status` | Print `runtime-config` + `GET /kasparex/node/:id/status` |

Override config path: `KREX_NODE_CONFIG=/path/to/config.json`.

## Install scripts

From repo root (or copy these files into a standalone operator repo):

- `install.sh` — checks `node` ≥ 20, runs `npm ci` + `npm run build`
- `install.bat` — Windows equivalent

See **COMPATIBILITY.md** for API base URLs and required headers.
