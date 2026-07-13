# Krex Node operator guide (practical)

This guide is for people running a **Krex Node** (light, edge, or super) on their own hardware or VPS. It complements the Hub UI at `/nodes` and the package README in `packages/krex-node/`.

---

## Two separate systems (important)

| System | Where it runs | What it is |
|--------|---------------|------------|
| **Kasparex Hub** | Vercel (website + Next.js API) | Enrollment UI, docs, wallet dApp |
| **Krex Node** | **Your PC or VPS** | `packages/krex-node` process (heartbeat + optional edge) |

**Vercel never runs your node.** Pushing Hub commits does not start, stop, or configure your node. Your `config.json` and `hmacSecret` stay on the machine where you run `npm run edge`.

---

## Quick answers (FAQ)

### How long can a node run?

There is no fixed time limit. The process is a small Node.js app (heartbeat + optional HTTP cache). Operators typically run it for days, months, or continuously on a VPS using **PM2** or **systemd**, with auto-restart on crash or reboot.

### Does the terminal need to stay open?

| How you start it | Terminal required? | Survives reboot? |
|------------------|-------------------|------------------|
| `npm run edge` in a shell | **Yes**, while that window is open | No |
| **PM2** (`ecosystem.config.cjs`) | **No**, runs in the background | Yes, after `pm2 save` + Windows boot helper (see below) |
| **systemd** (Linux VPS) | **No**, runs as a service | Yes |

For local learning, an open terminal is fine. For anything you rely on, use PM2 or systemd with boot auto-start.

### Does the node need to be restarted manually?

**No**, for normal operation. The process is lightweight and meant to run continuously. PM2 already restarts it if it crashes (`autorestart: true`). You only need to restart when:

- You change `config.json` (node URL, secret, role)
- You pull a new `krex-node` version (`npm run build`, then `pm2 restart krex-node-edge`)

There is no requirement to stop the node on a schedule.

### Does the computer need to stay on?

**Yes**, for the node to stay **online** in the registry:

- **Heartbeats** stop when the process stops.
- **Edge traffic** is only served while the HTTP server is up.

If your PC sleeps or you close the process, the Hub will show the node offline until it pings again. That is normal.

### Local vs public URL

| `url` in config | Who can use the edge |
|-----------------|------------------------|
| `http://localhost:8788` | Only your machine (good for testing) |
| `https://edge.example.com` | Anyone on the internet (production edge) |

The Worker and Hub registry store whatever URL you enroll. Browsers cannot reach `localhost` on your laptop from other users' devices.

---

## Security and data

### Secrets

| Item | Safe to commit to git? | Notes |
|------|------------------------|-------|
| `config.example.json` | Yes | Placeholders only |
| `config.json` | **Never** | Contains `hmacSecret`; listed in `packages/krex-node/.gitignore` |
| `node_id` | Low risk | Public in registry; not a secret |
| `hmacSecret` | **Never** | Same power as an API key for ping/register on your node |

If `hmacSecret` leaks, use **Rotate secret** in the Hub node dashboard and update `config.json` locally.

### What the node process does **not** do

- Does not hold your Kaspa private keys.
- Does not sign L1 transactions after enrollment.
- Does not write to Kasparex databases (only the Worker does, after verified enrollment).

### What data is shared

**Sent to the Kasparex Worker (heartbeats / ping):**

- `node_id`, uptime, optional request counters, version, role, region.
- HMAC-signed requests (proves you hold the enrolled secret).

**Edge (if enabled):**

- Serves **read-only** cached copies of public API responses (wallet deck/history, stats, proxy paths).
- Does not receive user private keys; browsers call your edge URL with public query params (e.g. address).

**Stored locally:**

- `config.json` on disk.
- Optional small in-memory/disk cache of proxied GET responses on the edge.

### Network requirements

- **Node.js 20+**
- Outbound HTTPS to `apiBaseUrl` (Worker) and upstream APIs the edge proxies.
- **Edge production:** inbound HTTPS (443) via reverse proxy to `servePort` (default **8788**).
- Rough footprint: low CPU; PM2 profile uses up to **512 MB** RAM restart threshold.

---

## Benefits

### For operators (today)

| Benefit | Details |
|---------|---------|
| **Hub Points on enroll** | +1,000 pts (server wallet ledger) |
| **Hub Points per qualified day** | +250 base pts when online ~12h+ in a UTC day (server cron) |
| **KREX tier multiplier** | Same 1x–4x Hub Points multipliers as the rest of the Hub (10M+ KREX = 2x daily, etc.) |
| **Rewards catalog** | Redeem pts for catalog items anytime |
| **Running public infrastructure** | Edge nodes can serve read traffic for the Hub (when on public HTTPS) |

Qualified epochs depend on staying **online**, meeting uptime rules in Worker policy, and heartbeats from your enrolled node.

### IPFS pin cache (light / edge, Track B3)

Operators can warm Hub catalog content locally (no full IPFS daemon required):

1. Worker publishes `pinCatalog` on `GET /kasparex/node/runtime-config`.
2. Optional manual CIDs in `config.json` → `pinnedCids`.
3. Run `node dist/cli.js pin-sync` or let `edge` / `light` sync every 6h (default).
4. Heartbeats report warmed CIDs; edge serves `GET /ipfs/{cid}` from disk.

After pulling updates: `npm run build` then `pm2 restart krex-node-edge`.

### For Kasparex Hub

| Benefit | How |
|---------|-----|
| **Lower Vercel / Worker load** | Hub tries **node-first** routing: your edge serves `/kasparex/wallet/deck`, `/health`, proxies before central API |
| **Geographic distribution** | Edges closer to users (when public) |
| **Resilience** | Fallback to central Worker if nodes are down |
| **Decentralized read path** | Read-only edges cache hot public reads |

Your local node already proves enrollment + heartbeat; public HTTPS edges are what unlock node-first traffic for other users.

---

## Git, Vercel, and `config.json`

### Pushing Hub commits

1. `config.json` is **gitignored** under `packages/krex-node/`.
2. You can `git push` Hub changes anytime; secrets in `config.json` are **not** uploaded to GitHub or Vercel.
3. You do **not** need to delete the secret from `config.json` before pushing.

### What happens on Vercel deploy

- Only the **marketplace / Hub** app rebuilds.
- Your **local node keeps running** independently with the same `config.json` on your PC.

### If you cloned the repo on another machine

1. Copy `config.example.json` → `config.json` again.
2. Paste `nodeId` + `hmacSecret` (from secure backup, or re-issue secret in Hub).
3. Run `npm install`, `npm run build`, `npm run edge`.

Optional: set `KREX_NODE_CONFIG=/secure/path/config.json` so config lives outside the repo tree.

---

## Recommended setups

### Local testing (what you are doing now)

```bash
cd packages/krex-node
cp config.example.json config.json   # once
# edit nodeId, hmacSecret, url: http://localhost:8788
npm install && npm run build
npm run edge
```

Check:

- [http://localhost:8788/health](http://localhost:8788/health)
- Hub **Nodes → Dashboard** (online after ~1 min; stable health after ~1 h uptime)

### Same machine, no open terminal (Windows-friendly)

Install PM2 globally, then:

```bash
cd packages/krex-node
pm2 start ecosystem.config.cjs
pm2 save
pm2 logs krex-node-edge
```

**One-time boot setup:**

```bash
# Windows (from packages/krex-node) — do NOT use plain pm2 startup on Windows
scripts\pm2-boot-setup.bat

# Linux / macOS
sh scripts/pm2-boot-setup.sh
```

On **Windows**, `pm2 startup` fails with `Init system not found` (that is normal). The batch script uses `pm2-windows-startup` instead. On Linux, follow the `pm2 startup` command PM2 prints (often with `sudo`).

### Production edge (later, step-by-step)

We will cover this when you go public. Summary:

1. VPS with Node 20+, firewall, HTTPS domain.
2. Reverse proxy (Caddy/nginx) → `127.0.0.1:8788`.
3. Update `url` in `config.json` and in Hub **Edit node details**.
4. PM2 or systemd for 24/7 uptime.

**Public HTTPS edge:** see [KREX_NODE_PUBLIC_EDGE.md](./KREX_NODE_PUBLIC_EDGE.md) (Cloudflare Tunnel or VPS + Caddy).

---

## Health: Unstable vs Stable

New nodes often show **Unstable (uptime 0.0h)** with a red health dot until enough successful heartbeats accumulate (typically about **1 hour**). If pings in the terminal show `ping ok` and `/health` is OK, you are fine.

---

## Useful commands

```bash
npm run once        # single ping test
npm run heartbeat   # heartbeat loop only (no edge HTTP)
npm run edge      # edge HTTP + heartbeat (recommended for edge role)
npm run status      # Worker runtime-config + your node status
```

---

## Related files

- `packages/krex-node/README.md` - commands and edge routes
- `packages/krex-node/COMPATIBILITY.md` - HMAC headers and API URLs
- `packages/krex-node/config.example.json` - safe template for git
- Hub: `/nodes` - enroll, edit URL, rotate secret, earnings
- [KREX_NODE_PUBLIC_EDGE.md](./KREX_NODE_PUBLIC_EDGE.md) - public HTTPS edge (Track B6)

---

## Checklist before going public

- [ ] Public HTTPS `url` (not localhost)
- [ ] `config.json` backed up securely (not in git)
- [ ] PM2/systemd auto-start on reboot
- [ ] Hub node URL updated to match
- [ ] Secret rotation plan if VPS is compromised

When you are ready for the public edge walkthrough, use the Hub **Nodes** tab and this doc as reference.
