# Public edge setup (Track B6)

Use this when your node is stable locally and you are ready to **enroll** as an Edge operator with a public HTTPS URL.

Local `http://localhost:8788` is for testing on your machine only. Hub enrollment for Edge/Super requires **HTTPS** on a public hostname.

---

## Before you start

- [ ] `npm run build` in `packages/krex-node`
- [ ] Edge responds locally: `http://localhost:8788/health`
- [ ] `config.json` backed up (contains `hmacSecret`)

---

## Option A: Cloudflare Tunnel (easiest on Windows, free tier)

Good for home PCs without opening router ports.

1. Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
2. Log in: `cloudflared tunnel login`
3. Create tunnel: `cloudflared tunnel create krex-edge`
4. Route DNS (example): `cloudflared tunnel route dns krex-edge edge.yourdomain.com`
5. Config file `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<you>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: edge.yourdomain.com
    service: http://127.0.0.1:8788
  - service: http_status:404
```

6. Run tunnel as service: `cloudflared service install` then start it.
7. Verify: `https://edge.yourdomain.com/health` from another device.
8. Enroll on Hub **Nodes → Enroll** with role **Edge** and URL `https://edge.yourdomain.com`.
9. Update `packages/krex-node/config.json`:

```json
"role": "edge",
"url": "https://edge.yourdomain.com"
```

10. `pm2 restart krex-node-edge`

---

## Option B: VPS + reverse proxy (production)

1. Small VPS (1 vCPU, 1 GB RAM is enough to start).
2. Install Node 20+, copy `packages/krex-node`, `config.json`, `npm ci && npm run build`.
3. PM2: `pm2 start ecosystem.config.cjs && pm2 save`.
4. Point domain A record to VPS IP.
5. **Caddy** (auto HTTPS):

```
edge.yourdomain.com {
  reverse_proxy 127.0.0.1:8788
}
```

6. Firewall: allow 80/443 only; keep 8788 on localhost.
7. Enroll on Hub with the HTTPS URL, then match `config.json`.

---

## After going public

| Check | Command / URL |
|-------|----------------|
| Health | `GET https://your-edge/health` |
| Worker registry | Hub Nodes dashboard shows your public URL |
| Node-first | Hub diagnostics panel should hit your node |
| IPFS pins | `GET https://your-edge/ipfs/{cid}` after `pin-sync` |

Pin catalog CIDs sync every 6h, or run `node dist/cli.js pin-sync`.

---

## Security notes

- Never commit `config.json` or `hmacSecret`.
- Use **Rotate secret** in Hub if the VPS is compromised.
- Edge nodes are **read-only**; no wallet keys on the node process.

---

## Related

- [KREX_NODE_OPERATOR_GUIDE.md](./KREX_NODE_OPERATOR_GUIDE.md)
- `packages/krex-node/README.md`
