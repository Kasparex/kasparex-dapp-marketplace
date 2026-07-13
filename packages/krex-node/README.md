# Krex Node (operator runtime)

Small **Node.js 20+** process for Kasparex Krex Nodes: signed **heartbeats** plus an optional **read-only mirror HTTP** server for node-first routing.

## Quick start (light node: heartbeat only)

```bash
cp config.example.json config.json
# Edit apiBaseUrl, nodeId, hmacSecret from enroll.
npm install
npm run build
npm run once
npm run heartbeat
```

## Mirror node (HTTP + heartbeat)

Set `"role": "mirror"` and a public HTTPS `"url"` in `config.json` (reverse proxy to `servePort`, default 8788).

```bash
npm run build
npm run mirror
```

Or under **pm2**:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 logs krex-node-mirror
```

**Auto-start after reboot** (run once per machine):

```bash
# Windows — plain pm2 startup does NOT work; use the script
scripts\pm2-boot-setup.bat

# Linux / macOS
sh scripts/pm2-boot-setup.sh
```

On Windows the script installs `pm2-windows-startup` and runs `pm2-startup install`. On Linux/macOS, run the `pm2 startup` command PM2 prints (often with `sudo`). After setup, the node restarts automatically when the PC boots (Windows: after user login). No need to manually restart unless you update `config.json` or upgrade the package.

## Commands

| Command | Description |
|--------|-------------|
| `once` | Single ping |
| `heartbeat` | Loop on `heartbeatIntervalSec` |
| `status` | Print `runtime-config` + node status |
| `serve` | Read-only mirror HTTP only |
| `mirror` | Mirror HTTP + heartbeat (recommended for mirror role) |

Override config path: `KREX_NODE_CONFIG=/path/to/config.json`.

## Mirror routes (read-only, CORS enabled)

| Path | Behavior |
|------|----------|
| `GET /health` | Node health + cache stats |
| `GET /kasparex/*` | Pass-through to `apiBaseUrl` with local cache |
| `GET /proxy/kasplex?endpoint=/v1/...` | Worker kasplex proxy |
| `GET /proxy/krc721?endpoint=/api/v1/...` | Worker KRC721 proxy |

The Kasparex Hub uses node-first routing: it tries your public `url` + `/kasparex/wallet/deck`, `/health`, etc., before falling back to the central Worker.

## Install scripts

- `install.sh` / `install.bat`  -  checks Node ≥ 20, runs `npm ci` + `npm run build`

See **COMPATIBILITY.md** for API base URLs and HMAC headers.

Operator FAQ (uptime, security, git/Vercel vs local config, incentives): **[docs/KREX_NODE_OPERATOR_GUIDE.md](../../docs/KREX_NODE_OPERATOR_GUIDE.md)**.
