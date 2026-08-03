# KCC20 Bridge (KRC-20 ↔ KCC20)

Hub dApp: [`/dapps/kcc20-bridge`](../src/components/dapps/KrexWrapBridgeWidget.tsx)

Old URL `/dapps/krex-wrap-bridge` redirects permanently to `/dapps/kcc20-bridge`.

Migrate any KRC-20 into matching KCC20 1:1 via a shared Hub vault. KREX remains the default preselected tick. Users can switch **Mainnet** / **Testnet** in the Migrate tab.

## Public UI rules

- Never show env var names, “Pending ops”, or “Not configured” on the public Metadata tab.
- Only show a vault address when it is actually set.
- No borrowed featured images: omit `featuredImage` so `KxListingFeaturedPlaceholder` renders.

## Configure vaults and bridge fee (ops)

Set these in Vercel project env (Production), then redeploy:

| Env | Purpose |
|-----|---------|
| `NEXT_PUBLIC_KCC20_BRIDGE_VAULT` | Mainnet Kaspa address that receives KRC-20 deposits |
| `NEXT_PUBLIC_KCC20_BRIDGE_VAULT_TESTNET` | Testnet-10 `kaspatest:` vault (enables Testnet deposits) |
| `NEXT_PUBLIC_KCC20_BRIDGE_TREASURY` | Optional; KAS fee destination (falls back to Store/ads treasury) |
| `NEXT_PUBLIC_KCC20_BRIDGE_FEE_KAS` | Base fee in KAS (default **5**) |
| `NEXT_PUBLIC_KCC20_BRIDGE_MIN_AMOUNT` | Min human amount per migrate (default 1) |
| `NEXT_PUBLIC_KREX_KCC20_COVENANT_ID` | Wrapped KREX covenant (64-hex) when mint is live |
| `NEXT_PUBLIC_KCC20_BRIDGE_COVENANTS` | JSON map `{"TICK":"<64hex>",...}` for more ticks |

Legacy aliases still work: `NEXT_PUBLIC_KREX_WRAP_VAULT`, `NEXT_PUBLIC_KREX_WRAP_FEE_KAS`, etc.

### Vault address checklist

1. Create (or assign) a **dedicated** deposit address. Prefer keyless burn-in for one-way, or a Matze-style release vault if you plan reverse later.
2. Fund it with a little KAS only if your watcher needs fees; users send **KRC-20**, not KAS, to this address for the deposit leg.
3. Put the address in `NEXT_PUBLIC_KCC20_BRIDGE_VAULT` (mainnet) and/or `…_TESTNET`.
4. Confirm the Migrate tab shows **Deposit vault** with that address (Metadata only shows vault when set).
5. Run a **mint watcher** that: scans vault KRC-20 transfers by tick → mints matching KCC20 1:1 to the sender → is idempotent on tx id.

Keep vault holdings per tick ≥ circulating wrapped KCC20 for that tick.

## Testnet practice path (TN10)

### A. Wallet

1. Switch KasWare / Kastle / Kaspire to **Testnet-10**.
2. Confirm address starts with `kaspatest:`.
3. Get TN10 KAS from the faucet: https://faucet-tn10.kaspanet.io/

### B. Deploy or pick a KRC-20 on TN10

Use any existing TN10 KRC-20, or deploy one via Kasplex / your usual KRC-20 deploy flow against TN10.

Indexer: `https://tn10api.kasplex.org/v1`  
Token lookup: `GET /krc20/token/{TICK}`  
Balance: `GET /krc20/address/{addr}/token/{TICK}`

### C. (Optional) Deploy mint-controlled KCC20 on TN10

Do **not** fair-launch a second free supply. Prefer mint-gated / capped KCC20 (same decimals), mint authority = your watcher only.

Record the covenant id (64-hex). Add it to `NEXT_PUBLIC_KCC20_BRIDGE_COVENANTS` when mint should go live for that tick.

### D. Hub Testnet vault

1. Set `NEXT_PUBLIC_KCC20_BRIDGE_VAULT_TESTNET=kaspatest:…`
2. Redeploy Vercel.
3. Open `/dapps/kcc20-bridge` → **Testnet** → look up your ticker → enter amount → pay **5 KAS** fee (tier-discounted) → confirm KRC-20 send to the shown vault.
4. Soft verify hits TN10 Kasplex via `/api/krex-wrap/verify` with `network: "testnet-10"`.
5. When your watcher mints, balance appears as KCC20 for that covenant.

Until the testnet vault env is set, Testnet mode still lets you look up TN10 tokens but deposits stay closed (user-facing “not open yet”, no env names).

## Liquidity if you deploy on kascov first

kascov is an **indexer / explorer / builder**, not a DEX. Deploying there does not by itself create a buy button.

People buy after you:

1. Add a market on a KCC20-capable DEX (KRON / Kcom / others when they list by covenant id), or
2. Seed Hub Tokens listing + bridge so utility demand exists, then list the covenant id on DEX.

## Trust model

- Not fully on-chain / third-party-free.
- KRC-20 recognition depends on indexers (mainnet `api.kasplex.org`, testnet `tn10api.kasplex.org`).
- Mint/release depends on the watcher.

## Multi-token registry

Shared vault + per-tick KCC20 covenant map. KREX is the default pair.
