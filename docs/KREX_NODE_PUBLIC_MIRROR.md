# Public mirror setup (Track B6)

Use this when your node is stable locally and you want **other Hub users** to reach your mirror (node-first routing, IPFS pin serving).

Local `http://localhost:8788` only works on your PC. Production requires **HTTPS** on a public hostname.

---

## Before you start

- [ ] Node enrolled and heartbeats OK (`pm2 logs krex-node-mirror`)
- [ ] `npm run build` in `packages/krex-node`
- [ ] Mirror responds: `http://localhost:8788/health`
- [ ] `config.json` backed up (contains `hmacSecret`)

---

## Option A: Cloudflare Tunnel (easiest on Windows, free tier)

Good for home PCs without opening router ports.

1. Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
2. Log in: `cloudflared tunnel login`
3. Create tunnel: `cloudflared tunnel create krex-mirror`
4. Route DNS (example): `cloudflared tunnel route dns krex-mirror mirror.yourdomain.com`
5. Config file `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<you>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: mirror.yourdomain.com
    service: http://127.0.0.1:8788
  - service: http_status:404
```

6. Run tunnel as service: `cloudflared service install` then start it.
7. Update `packages/krex-node/config.json`:

```json
"url": "https://mirror.yourdomain.com"
```

8. Update the same URL in Hub **Nodes → Edit node details**.
9. `pm2 restart krex-node-mirror`

Verify: `https://mirror.yourdomain.com/health` from another device or phone (not on Wi‑Fi only if you used a real domain).

---

## Option B: VPS + reverse proxy (production)

1. Small VPS (1 vCPU, 1 GB RAM is enough to start).
2. Install Node 20+, clone or copy `packages/krex-node`, `config.json`, `npm ci && npm run build`.
3. PM2 or systemd: `pm2 start ecosystem.config.cjs && pm2 save`.
4. Point domain A record to VPS IP.
5. **Caddy** (auto HTTPS):

```
mirror.yourdomain.com {
  reverse_proxy 127.0.0.1:8788
}
```

6. Firewall: allow 80/443 only; keep 8788 on localhost.
7. Set `url` in config + Hub registry as in Option A.

---

## After going public

| Check | Command / URL |
|-------|----------------|
| Health | `GET https://your-mirror/health` |
| Worker registry | Hub Nodes dashboard shows your public URL |
| Node-first | Hub diagnostics panel should hit your node (not only central) |
| IPFS pins | `GET https://your-mirror/ipfs/{cid}` after `pin-sync` |

Pin catalog CIDs sync automatically every 6h, or run `node dist/cli.js pin-sync`.

---

## Security notes

- Never commit `config.json` or `hmacSecret`.
- Use **Rotate secret** in Hub if the VPS is compromised.
- Mirror is **read-only**; no wallet keys on the node process.

---

## Related

- [KREX_NODE_OPERATOR_GUIDE.md](./KREX_NODE_OPERATOR_GUIDE.md)
- `packages/krex-node/README.md`
