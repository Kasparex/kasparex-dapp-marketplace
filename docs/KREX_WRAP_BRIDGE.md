# KCC20 Bridge (KRC-20 ↔ KCC20)

Hub dApp: [`/dapps/kcc20-bridge`](../src/components/dapps/KrexWrapBridgeWidget.tsx)

Old URL `/dapps/krex-wrap-bridge` redirects permanently to `/dapps/kcc20-bridge`.

Migrate any KRC-20 into matching KCC20 1:1 via a shared Hub vault. Default tick is **KREX** on Mainnet and **TKREX** on Testnet. Users can switch **Mainnet** / **Testnet** in the Migrate tab.

Note: bridge env vars must be read via static `process.env.NEXT_PUBLIC_*` names (Next.js does not inline dynamic `process.env[key]` in the client bundle).

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

### Kasparex bridge wallet roster (public addresses only)

Never commit private keys or seeds. These are deposit / fee / ops **public** addresses.

| Role | Mainnet | Testnet-10 |
|------|---------|------------|
| **1 Vault** (KRC-20 deposits) | `kaspa:qrwa6q8pk80dzpatgas9es2re0kusnja305wsnealy0hj480w452yw0a47fpf` | `kaspatest:qrwa6q8pk80dzpatgas9es2re0kusnja305wsnealy0hj480w452y0fmw3hsd` |
| **2 Treasury** (KAS bridge fees) | `kaspa:qpgmnzeq5e59er2hkadaxd7s3yc8k69s4pqkxvw0zsktuk787e94wneakaxhm` | `kaspatest:qpgmnzeq5e59er2hkadaxd7s3yc8k69s4pqkxvw0zsktuk787e94wjlmdjcxl` |
| **3 Mint / watcher signer** (KCC20 mint authority; keep seed offline / HSM) | `kaspa:qqn2344wcpyrp3w4jx8dc6zd0mn2ml4glgn84ufwv7em20udf2s9zx8pah5nq` | `kaspatest:qqn2344wcpyrp3w4jx8dc6zd0mn2ml4glgn84ufwv7em20udf2s9z8p8xc2zy` |
| **4 Spare / future reverse vault** | `kaspa:qp7myp956kxnw94xtgan0jc4r5j2sfm7v0gvqtw59x2uq4sj2cqsge4frgz8w` | `kaspatest:qp7myp956kxnw94xtgan0jc4r5j2sfm7v0gvqtw59x2uq4sj2cqsgcn0c8uk2` |
| **5 Spare / ops / emergency** | `kaspa:qp47tq6scx3acjz9ptrqx9ehxzse4q40fw0d6s0sfcz9jdsdf7ujyrx4pcz8x` | `kaspatest:qp47tq6scx3acjz9ptrqx9ehxzse4q40fw0d6s0sfcz9jdsdf7ujyzqn6hukz` |

Suggested Vercel values when you go live:

```bash
NEXT_PUBLIC_KCC20_BRIDGE_VAULT=kaspa:qrwa6q8pk80dzpatgas9es2re0kusnja305wsnealy0hj480w452yw0a47fpf
NEXT_PUBLIC_KCC20_BRIDGE_VAULT_TESTNET=kaspatest:qrwa6q8pk80dzpatgas9es2re0kusnja305wsnealy0hj480w452y0fmw3hsd
NEXT_PUBLIC_KCC20_BRIDGE_TREASURY=kaspa:qpgmnzeq5e59er2hkadaxd7s3yc8k69s4pqkxvw0zsktuk787e94wneakaxhm
NEXT_PUBLIC_KCC20_BRIDGE_FEE_KAS=5
# TN10 TKREX KCC20Capped asset (OpenSilver deploy; blake2b-256 template hash):
NEXT_PUBLIC_KCC20_BRIDGE_COVENANTS={"TKREX":"c9d0799b9640c3b7d10e5d90fcc58f38fa99c947f30e2c4f44a85b7f394600ef"}
```

Note: Hub currently has one treasury env for fees (mainnet-oriented). Testnet fee sink can stay as wallet **2** `kaspatest:…` for manual TN10 fee checks until you add a dedicated testnet treasury env.

### Vault address checklist

1. Vault = wallet **1** (deposits only).
2. Fund mint/watcher wallet **3** with a little KAS for mint fees when live.
3. Users send **KRC-20**, not KAS, to the vault for the deposit leg.
4. Confirm Migrate tab shows **Deposit vault**.
5. Mint watcher: vault transfers by tick → mint KCC20 1:1 to sender (idempotent on tx id). Mint authority = wallet **3**.

Keep vault holdings per tick ≥ circulating wrapped KCC20 for that tick.

## KRC-20 KREX reference tokenomics (match on wrap side)

From Kasplex mainnet (`/v1/krc20/token/KREX`):

| Field | Value |
|-------|--------|
| Tick | `KREX` |
| Decimals | `8` |
| Max (raw) | `2100000000000000000` |
| Max (human) | **21,000,000,000** KREX |
| State | `finished` (fully minted on KRC-20) |

For **test** wrapped asset use ticker **`TKREX`** (not `KREX`) so mainnet holders and indexers never confuse rails.

## Deploy TKREX on KCC20 testnet-10 (step by step)

**Yes: TKREX-only for tests is the right approach.** Same decimals + same max supply story as KREX; separate ticker; throwaway if you mess up mint rules.

### Critical: do not use KRON fair-launch for the wrap token

KRON `/launch/new` defaults to **full premint + mint renounced + AMM**. That creates a **second free supply**, which breaks the wrap model.

For bridge wrapping you need:

- **Mint-controlled / capped** KCC20
- **Max supply** = 21e9 (same as KREX), **8 decimals**
- **Mint authority** = watcher wallet (**3**), not open public mint
- **No** public fair-launch allocation

### Steps

1. **Wallet setup (TN10)**
   - Switch wallet to Testnet-10.
   - Prefer mint authority = wallet **3** `kaspatest:qqn2344wcpyrp3w4jx8dc6zd0mn2ml4glgn84ufwv7em20udf2s9z8p8xc2zy`.
   - Fund it from https://faucet-tn10.kaspanet.io/

2. **Also need a KRC-20 TKREX on TN10** (deposit side of the bridge)
   - Deploy or mint a KRC-20 tick `TKREX` on TN10 via Kasplex / your usual KRC-20 deploy tools.
   - Match: **8 decimals**, max **21e9** if the deploy UI allows (or document whatever TN10 allows and keep KCC20 cap ≤ that).
   - Confirm: `https://tn10api.kasplex.org/v1/krc20/token/TKREX`

3. **Deploy mint-gated KCC20 TKREX**
   Use a covenant token builder that supports **controlled mint** (not KRON fair-launch), for example:
   - [kascov builder / playground](https://kascov.io/#/playground) / lab on **testnet-10**, or
   - Any KCC20 template that sets: ticker `TKREX`, decimals `8`, max `2100000000000000000` (raw) or human 21e9, **mint key = wallet 3**.
   - Deploy on **testnet-10** only.
   - After deploy, copy the **64-hex covenant id**.

4. **Verify on explorers**
   - [kascov tokens / explore](https://kascov.io/#/explore) on testnet-10
   - Confirm ticker, decimals, max, and that mint is not open to the public

5. **Wire Hub (after you are ready)**
   ```bash
   NEXT_PUBLIC_KCC20_BRIDGE_VAULT_TESTNET=kaspatest:qrwa6q8pk80dzpatgas9es2re0kusnja305wsnealy0hj480w452y0fmw3hsd
   NEXT_PUBLIC_KCC20_BRIDGE_FEE_KAS=5
   NEXT_PUBLIC_KCC20_BRIDGE_COVENANTS={"TKREX":"c9d0799b9640c3b7d10e5d90fcc58f38fa99c947f30e2c4f44a85b7f394600ef"}
   ```
   Redeploy Vercel.

   Genesis refs (TN10):
   - Controller: `fcebdc8c73b6bac5463702a65cc4086235c3726bb778e5d5190f59f365677871` (`493f9308…`)
   - Asset init: `2bca00fc958635efd1cda696a9c7257f13b12e8a78a3326f39b3d17e7aa3fed6` (`c9d0799b…`)
   - Template hash must be real blake2b-256 (not blake2b-512 truncated). Wrong hash allows genesis but blocks mint.

6. **TN10 mint watcher (operator host)**
   - Hub History stays `Pending mint` until a mint receipt exists for the deposit tx.
   - Receipts live in `data/krex-wrap/mint-receipts-tn10.json` (GET `/api/krex-wrap/mint-receipts`).
   - Run on a trusted machine with wallet **3** key (never in Vercel):
     ```bash
     set KREX_WRAP_HUB_URL=https://<your-hub>
     set KCC20_BRIDGE_WATCHER_SECRET=<same as Vercel>
     node scripts/tkrex-mint-watcher.mjs --once --key-file tkrex-deploy/wallet3.privkey.json
     # or loop:
     node scripts/tkrex-mint-watcher.mjs --key-file tkrex-deploy/wallet3.privkey.json
     ```
   - Watcher: Kasplex vault transfers → `broadcast-tkrex-mint.mjs` → POST receipt (needs `KCC20_BRIDGE_WATCHER_SECRET` + `GITHUB_TOKEN` on Hub for persist).
   - Manual one-off still works: `TKREX_MINT_AMOUNT_RAW=… TKREX_DEPOSIT_TXID=… node scripts/broadcast-tkrex-mint.mjs --broadcast --key-file …`
   - Known live mints: 10 TKREX `5ca47a88…`, 12 TKREX `faa27724…`. Older pre-test vault transfers are listed under `ignoredDepositTxHashes`.
   - Confirm KCC20 on the mint explorer tx / recipient P2SH (not KasWare KRC-20 balances).

7. **Only later: mainnet wrapped KREX**
   - Same pattern with ticker **KREX**, vault **1** mainnet, mint key **3** mainnet
   - Set `NEXT_PUBLIC_KREX_KCC20_COVENANT_ID` / covenants map
   - Never fair-launch a second free KREX on KCC20
   - Do not enable the watcher on mainnet until key custody + idempotency are production-ready.

### What “same tokenomics” means for TKREX

| Match KREX | TKREX test |
|------------|------------|
| Decimals 8 | Yes |
| Max 21,000,000,000 | Yes (cap) |
| No extra free float | Yes: mint only against vault deposits |
| Ticker | **`TKREX`** (test only) |
| Network | testnet-10 only |

## Liquidity if you deploy on kascov first

kascov is an **indexer / explorer / builder**, not a DEX. Deploying there does not by itself create a buy button.

People buy after you:

1. Add a market on a KCC20-capable DEX (KRON / Kcom / others when they list by covenant id), or
2. Seed Hub Tokens listing + bridge so utility demand exists, then list the covenant id on DEX.

## Trust model

- Not fully on-chain / third-party-free.
- KRC-20 recognition depends on indexers (mainnet `api.kasplex.org`, testnet `tn10api.kasplex.org`).
- Mint/release depends on the watcher.

## kascov ticker and logo

Yes: TN10 TKREX KCC20 lives on kascov at the asset covenant id
`c9d0799b9640c3b7d10e5d90fcc58f38fa99c947f30e2c4f44a85b7f394600ef`
([coin page](https://kascov.io/#/testnet-10/c/c9d0799b9640c3b7d10e5d90fcc58f38fa99c947f30e2c4f44a85b7f394600ef)).

kascov does **not** take ticker/logo from Hub env. It only shows a claimed name when the **genesis transaction payload** includes JSON such as:

```json
{"name": "Test KREX", "ticker": "TKREX", "image": "https://…/tkrex.png", "image_hash": "<sha256 of image bytes>"}
```

This live TN10 genesis did not include that payload, so kascov keeps its deterministic friendly name. To get a named badge + image link you must include the JSON on the **next** genesis (new covenant id), then update Hub `NEXT_PUBLIC_KCC20_BRIDGE_COVENANTS`. Prefer `image` + `image_hash` so kascov can verify the art.

## Multi-token registry

Shared vault + per-tick KCC20 covenant map. KREX is the default pair on mainnet; **TKREX** is the TN10 test pair.

