# KREX Node quickstart (for operators)

A short, accurate guide. The operator software lives in **`packages/krex-node`** inside the [kasparex-dapp-marketplace](https://github.com/Kasparex/kasparex-dapp-marketplace) repo. There is **no** separate `kasparex-krex-node` repository today.

---

## Do I need a domain?

| Goal | Domain required? |
|------|------------------|
| Enroll, earn Hub Points, run heartbeats on your PC | **No** |
| Test mirror on your machine (`localhost:8788`) | **No** |
| Serve other Hub users via node-first routing | **Yes** (public **HTTPS** URL) |

For most operators starting out: **no domain**. Use `http://localhost:8788` in config while learning. Add a public URL later (see [KREX_NODE_PUBLIC_MIRROR.md](./KREX_NODE_PUBLIC_MIRROR.md)).

---

## What you need

- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- A **PC, laptop, or VPS** that can stay online (sleep/offline = node shows offline)
- A **Kaspa wallet** (same one you use on Kasparex Hub)
- About **15–30 minutes** for first setup
- Optional: **PM2** for background + auto-start (`npm install -g pm2`)

You do **not** need: a Kaspa full node, special hardware, or a domain (to start).

---

## Step-by-step

### 1. Enroll on the Hub

1. Open [kasparex.com/nodes](https://kasparex.com/nodes) (or your Hub URL `/nodes`).
2. Connect your Kaspa wallet.
3. **Enroll** tab: complete wallet sign + optional on-chain verify.
4. Save **`nodeId`** and **`hmacSecret`** (shown once). You will put these in `config.json`.

### 2. Get the software

```bash
git clone https://github.com/Kasparex/kasparex-dapp-marketplace.git
cd kasparex-dapp-marketplace/packages/krex-node
```

Or, if you already have the marketplace repo, just `cd packages/krex-node`.

### 3. Configure

```bash
cp config.example.json config.json
```

Edit `config.json`:

| Field | Value |
|-------|--------|
| `apiBaseUrl` | `https://kasparex-api.kasparexcom.workers.dev` |
| `nodeId` | From enroll |
| `hmacSecret` | From enroll (keep secret) |
| `role` | `mirror` (recommended) or `light` |
| `url` | `http://localhost:8788` for local testing |
| `region` | e.g. `eu-central` |

**Never commit `config.json`** (it is gitignored).

### 4. Install and run

```bash
npm install
npm run build
npm run mirror
```

You should see `ping ok` in the terminal and `/health` works at [http://localhost:8788/health](http://localhost:8788/health).

### 5. Keep it running (recommended)

**Windows:**

```bat
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
scripts\pm2-boot-setup.bat
```

Use `pm2-windows-startup` (via the script), **not** plain `pm2 startup` on Windows.

---

## Rewards (simple)

- **+1,000 Hub Points** once when you enroll (wallet-bound on server)
- **+250 base pts per qualified day** you stay online (~12h+ in a UTC day), × your **KREX tier**
- Redeem on the Hub **Rewards** catalog

---

## Light vs mirror

| Type | What it does |
|------|----------------|
| **Light** | Heartbeats + local IPFS pin cache |
| **Mirror** | Light + small read-only HTTP server (recommended) |

---

## Going public later

When you want other users to use your node, set a public **HTTPS** `url` in config and in the Hub **Edit node details**. See [KREX_NODE_PUBLIC_MIRROR.md](./KREX_NODE_PUBLIC_MIRROR.md).

---

## More detail

- [KREX_NODE_OPERATOR_GUIDE.md](./KREX_NODE_OPERATOR_GUIDE.md) (FAQ, security, PM2)
- Hub **Nodes → Setup** and **Docs** tabs
- Knowledge base: `/knowledge-base/krex-node-setup`
