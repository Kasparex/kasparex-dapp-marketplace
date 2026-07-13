# KREX Node quickstart (for operators)

Operator software: **`packages/krex-node`** in [kasparex-dapp-marketplace](https://github.com/Kasparex/kasparex-dapp-marketplace).

**Node types:** Light · Edge · Super

**Enroll pts:** 500 · 700 · 1,000

**Daily pts (base):** 100 · 250 · 500 (× KREX tier)

---

## Do I need a domain?

| Goal | Domain required? |
|------|------------------|
| Light node (heartbeats + pins) | **No** |
| Local testing (`localhost:8788`, not enrolled) | **No** |
| Enroll **Edge** or **Super** (public helper) | **Yes** (public **HTTPS** URL) |

---

## What you need

- **Node.js 20+**
- A **PC or VPS** that can stay online
- A **Kaspa wallet** for Hub enroll
- For Edge: Cloudflare Tunnel or VPS HTTPS (see [KREX_NODE_PUBLIC_EDGE.md](./KREX_NODE_PUBLIC_EDGE.md))

---

## Step-by-step (Edge, recommended)

### 1. Get the software and test locally

```bash
git clone https://github.com/Kasparex/kasparex-dapp-marketplace.git
cd kasparex-dapp-marketplace/packages/krex-node
npm install && npm run build
npm run edge
```

Open `http://localhost:8788/health` on your machine.

### 2. Expose HTTPS

Cloudflare Tunnel or VPS reverse proxy to port 8788. Verify `https://your-host/health` from another device.

### 3. Enroll on the Hub

1. Open `/nodes` → **Enroll**
2. Role: **Edge**
3. URL: your public `https://...`
4. Save **`nodeId`** and **`hmacSecret`**

### 4. Configure

```bash
cp config.example.json config.json
```

| Field | Value |
|-------|--------|
| `apiBaseUrl` | `https://kasparex-api.kasparexcom.workers.dev` |
| `nodeId` / `hmacSecret` | From enroll |
| `role` | `edge` |
| `url` | Same public HTTPS URL |

### 5. Keep it running

```bat
pm2 start ecosystem.config.cjs
pm2 save
scripts\pm2-boot-setup.bat
```

---

## Light node

Enroll with role **Light** (no public URL). Run `npm run light` or `npm run heartbeat`.

---

## More

- [KREX_NODE_OPERATOR_GUIDE.md](./KREX_NODE_OPERATOR_GUIDE.md)
- [KREX_NODE_PUBLIC_EDGE.md](./KREX_NODE_PUBLIC_EDGE.md)
- Hub `/nodes` → FAQ tab
