# Krex Edge DNS with kasparex.com (Wix + Cloudflare Tunnel)

## Wix limitation (read first)

[Wix domains cannot change nameservers](https://support.wix.com/en/article/connecting-a-wix-domain-to-an-external-site) without **transferring domain registration away from Wix**.

A CNAME in Wix (`edge` → `<tunnel-id>.cfargotunnel.com`) is **not enough** for a named tunnel. Cloudflare only routes tunnel traffic when the zone is active in your Cloudflare account (nameservers at Cloudflare).

| Path | Works for production Edge? |
|------|----------------------------|
| Wix CNAME only | **No** (403 / unreachable) |
| Transfer registration to Cloudflare, DNS at Cloudflare | **Yes** (Wix site can stay up via DNS records) |
| Quick tunnel `*.trycloudflare.com` | **Yes for testing** (URL changes on restart) |

---

## Fast path: quick tunnel (enroll today)

**Terminal 1** (edge process):

```bash
cd packages/krex-node
npm run edge
```

**Terminal 2** (free HTTPS URL):

Windows:

```powershell
winget install --id Cloudflare.cloudflared -e
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:8788
```

macOS / Linux:

```bash
cloudflared tunnel --url http://127.0.0.1:8788
```

Copy the printed `https://....trycloudflare.com` URL into Hub **Nodes → Enroll** and `config.json` `url`.

---

## Production path: Cloudflare DNS (Wix site can remain)

Use this when you are ready to **transfer domain registration** from Wix to Cloudflare (or another registrar with Cloudflare DNS). This is not the same as deleting your Wix site. You copy Wix A/CNAME records into Cloudflare DNS so `kasparex.com` / `www` still point at Wix.

Goals:

- **kasparex.com** / **www** keep serving the Wix site
- **edge.kasparex.com** reaches your home PC Krex Edge (Cloudflare Tunnel, free HTTPS)

---

## Overview

| Hostname | Points to |
|----------|-----------|
| `kasparex.com` | Wix (unchanged for visitors) |
| `www.kasparex.com` | Wix |
| `edge.kasparex.com` | Cloudflare Tunnel to `localhost:8788` |

---

## Part 1: Add site to Cloudflare

1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com).
2. **Add a site** → enter `kasparex.com` → **Free** plan.
3. Cloudflare scans existing DNS. Review imported records.
4. Cloudflare shows **two nameservers** (example: `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`). Copy them.

---

## Part 2: Point nameservers at Wix

1. Wix: **Domains** → `kasparex.com` → **Manage DNS** / **Connect domain**.
2. Choose **Use external DNS** or **Change nameservers** (wording varies).
3. Replace Wix nameservers with the **Cloudflare** pair from Part 1.
4. Save. Propagation can take from a few minutes up to 48 hours (often under 1 hour).

Until propagation completes, the Wix site may be briefly unavailable. Plan a quiet window if needed.

---

## Part 3: DNS records in Cloudflare

After the site is **Active** in Cloudflare:

### Keep Wix working

In Wix **Domains → Manage → DNS records**, note the targets Wix uses for the live site. Typical pattern:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `www` | `www.wixdns.net` or site-specific Wix host | Proxied (orange cloud) |
| A or CNAME | `@` (root) | Wix IP or `www.wixdns.net` | Proxied |

Wix help: [Connecting a domain to Wix with external DNS](https://support.wix.com/en/article/connecting-a-domain-to-wix-with-external-dns).

Add matching records in **Cloudflare → DNS → Records**. If root `@` cannot be a CNAME, use Wix **A records** for apex or Cloudflare **CNAME flattening** on `@` to the Wix target.

### Edge subdomain (added by tunnel script)

After `cloudflared tunnel route dns`, Cloudflare creates:

| Type | Name | Target |
|------|------|--------|
| CNAME | `edge` | `<tunnel-id>.cfargotunnel.com` |

Do not proxy the tunnel record differently than cloudflared expects; the `tunnel route dns` command sets this correctly.

---

## Part 4: Install cloudflared (Windows)

```powershell
winget install --id Cloudflare.cloudflared -e
```

Close and reopen the terminal, then:

```powershell
cloudflared --version
```

---

## Part 5: Tunnel + local edge

Prerequisites:

- `packages/krex-node`: `npm run build`
- Edge online: `pm2 start ecosystem.config.cjs` (or `pm2 restart krex-node-edge`)
- Local check: [http://localhost:8788/health](http://localhost:8788/health)

### Automated script

From `packages/krex-node`:

```bat
scripts\cloudflare-tunnel-setup.bat
```

### Manual commands

```powershell
cloudflared tunnel login
cloudflared tunnel create krex-edge
cloudflared tunnel route dns krex-edge edge.kasparex.com
```

Create `%USERPROFILE%\.cloudflared\config.yml` (replace `<TUNNEL_ID>`):

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<you>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: edge.kasparex.com
    service: http://127.0.0.1:8788
  - service: http_status:404
```

Install and run:

```powershell
cloudflared service install
```

Or test without service:

```powershell
cloudflared tunnel run krex-edge
```

Verify from phone (not on home Wi-Fi if possible):

`https://edge.kasparex.com/health`

---

## Part 6: Hub enrollment

1. Hub **Nodes → Enroll** (or edit existing node).
2. Role: **Edge**
3. URL: `https://edge.kasparex.com`
4. Update `packages/krex-node/config.json`:

```json
"role": "edge",
"url": "https://edge.kasparex.com"
```

5. `pm2 restart krex-node-edge`

---

## Checklist

- [ ] Cloudflare shows `kasparex.com` as Active
- [ ] Wix site loads at `https://kasparex.com` and `https://www.kasparex.com`
- [ ] `https://edge.kasparex.com/health` returns OK from another network
- [ ] Hub node URL matches `https://edge.kasparex.com`
- [ ] `config.json` URL matches Hub
- [ ] PM2: `krex-node-edge` online
- [ ] Cloudflare tunnel service starts on Windows boot

---

## Related

- [KREX_NODE_PUBLIC_EDGE.md](./KREX_NODE_PUBLIC_EDGE.md)
- [KREX_NODE_OPERATOR_GUIDE.md](./KREX_NODE_OPERATOR_GUIDE.md)
- `packages/krex-node/scripts/cloudflare-tunnel-setup.bat`
