# KREX Wrap Bridge (KRC-20 ↔ KCC20)

Hub dApp: [`/dapps/krex-wrap-bridge`](../src/components/dapps/KrexWrapBridgeWidget.tsx)

## Liquidity if you deploy on kascov first

kascov is an **indexer / explorer / builder**, not a DEX. Deploying there does not by itself create a buy button.

People buy after you:

1. Add a market on a KCC20-capable DEX (KRON / Kcom / others when they list by covenant id), or
2. Seed Hub Tokens listing + wrap so utility demand exists, then list the covenant id on DEX.

So: deploy (kascov or custom) → connect covenant id in Hub → list/trade on KRON (or peer DEX) when they accept that covenant. Order can be DEX-first if KRON can launch a mint-gated token.

## Deploying wrapped KCC20 KREX (ops)

Do **not** fair-launch a second free-supply KREX on KRON/Kcom. That creates a competing token.

Best path:

1. Deploy a **mint-controlled / capped KCC20** (same decimals as KRC-20, usually 8; same max supply story).
2. Mint authority = wrap controller only (vault watcher), never open public mint.
3. Circulating KCC20 must never exceed KRC-20 locked in the wrap vault.
4. Use **KRON / KaspaCom / kascov** afterward for discovery, listing, and trading the wrapped asset, not for inventing new supply.
5. Keep ticker branding as **KREX** (or clearly “Wrapped KREX”) so wallets show two rails of the same project, not two projects.

Tokenomics checklist vs KRC-20:

| Field | Rule |
|-------|------|
| Decimals | Match KRC-20 |
| Max supply | Match (or cap at remaining unwrapped + vault) |
| Team / investor unlocks | Do **not** remint on KCC20 |
| Circulating | Only mint 1:1 against vault deposits |
| Naming | Same brand; wallets may still show two rows (KRC20 tab / KCC20 tab) |

## What shipped (v0.1)

- One-way wrap UI: pay tier-discounted KAS fee → send KRC-20 KREX to configured vault.
- Client wrap history + soft deposit verify via Kasplex (`/api/krex-wrap/verify`).
- Public config (`/api/krex-wrap/config`).
- Hub tier plumbing: `queryKREXBalance` total = L1 KRC-20 + L2 ERC-20 + optional KCC20 wrap.
- Bridge modal entry point to the Hub wrap dApp.

## Ops to go live

1. Deploy / assign a **deposit vault** address (keyless burn-in, or Matze-style release vault for later two-way).
2. Set env (see `.env.example`):
   - `NEXT_PUBLIC_KREX_WRAP_VAULT`
   - `NEXT_PUBLIC_KREX_WRAP_TREASURY` (optional)
   - `NEXT_PUBLIC_KREX_WRAP_FEE_KAS` (default `2`)
   - `NEXT_PUBLIC_KREX_KCC20_COVENANT_ID` after the wrapped KCC20 exists
3. Run a **mint watcher**: scan vault KRC-20 deposits → mint/send KCC20 1:1 to sender (idempotent).
4. Keep vault KRC-20 holdings ≥ circulating wrapped KCC20.

## Hub tiers for wrapped holders

Yes. Once `NEXT_PUBLIC_KREX_KCC20_COVENANT_ID` is set and kcc20.info (or fallback) returns balances, wrapped KREX is added into `useKREXBalance().balance` and therefore into `getKREXTierFromBalance`. Same fee discounts, Hub points multipliers, and GRID calculator tiers as KRC-20 / L2 KREX.

No separate “KCC20 tier table” is required if wrap is 1:1 and the covenant id is the canonical wrapped KREX.

## New KCC20 token vs wrap (product advice)

| Path | Pros | Cons |
|------|------|------|
| **Wrap existing KRC-20 KREX** | Keeps one economic supply; holders migrate without abandonment; Hub tiers stay continuous | Needs vault + mint watcher; KRC-20 side is not consensus-trustless |
| **Launch a brand-new KCC20** | Clean covenant-native story; faster narrative vs “old KRC-20” | Splits liquidity and mindshare; old holders feel left behind; tiers must be dual-tracked or reset |

Recommendation: **do not replace KREX with a disconnected new ticker**. Interest is moving to KCC20 because it is programmable on L1. Meet that demand by wrapping (or a controlled mint that requires burning/locking KRC-20). A second unlinked token accelerates the drop you are seeing.

Optional naming: keep tick display as **KREX** on KCC20 pages, with a clear “wrapped from KRC-20” badge (avoid inventing a competing brand unless marketing explicitly wants a relaunch).

## Trust model (be honest in UI)

- Not fully on-chain / third-party-free.
- KRC-20 recognition depends on indexers.
- Mint/release depends on the watcher (and later release keys / MPC for unwrap).

## Later: multi-token factory + fees

Same rails: per-tick vault + KCC20 pair registry, listing fee to add a tick, per-wrap KAS (or skim) fee. KREX is the first pair.
