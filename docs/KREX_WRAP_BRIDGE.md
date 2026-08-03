# KRC20 Wrap Bridge (KRC-20 ↔ KCC20)



Hub dApp: [`/dapps/krex-wrap-bridge`](../src/components/dapps/KrexWrapBridgeWidget.tsx) (slug kept for stable URLs)



Wrap any KRC-20 into matching KCC20 1:1 via a shared Hub vault. KREX remains the default preselected tick and the first covenant pair for Hub tiers.



## Liquidity if you deploy on kascov first



kascov is an **indexer / explorer / builder**, not a DEX. Deploying there does not by itself create a buy button.



People buy after you:



1. Add a market on a KCC20-capable DEX (KRON / Kcom / others when they list by covenant id), or

2. Seed Hub Tokens listing + wrap so utility demand exists, then list the covenant id on DEX.



So: deploy (kascov or custom) → connect covenant id in Hub → list/trade on KRON (or peer DEX) when they accept that covenant. Order can be DEX-first if KRON can launch a mint-gated token.



## Deploying wrapped KCC20 (ops)



Do **not** fair-launch a second free-supply copy of an existing KRC-20 on KRON/Kcom. That creates a competing token.



Best path per tick:



1. Deploy a **mint-controlled / capped KCC20** (same decimals as the KRC-20, usually 8; same max supply story).

2. Mint authority = wrap controller only (vault watcher), never open public mint.

3. Circulating KCC20 must never exceed that tick's KRC-20 locked in the wrap vault.

4. Use **KRON / KaspaCom / kascov** afterward for discovery, listing, and trading the wrapped asset, not for inventing new supply.

5. Keep ticker branding aligned (e.g. **KREX** / clearly “Wrapped KREX”) so wallets show two rails of the same project, not two projects.



Tokenomics checklist vs KRC-20:



| Field | Rule |

|-------|------|

| Decimals | Match KRC-20 |

| Max supply | Match (or cap at remaining unwrapped + vault) |

| Team / investor unlocks | Do **not** remint on KCC20 |

| Circulating | Only mint 1:1 against vault deposits |

| Naming | Same brand; wallets may still show two rows (KRC20 tab / KCC20 tab) |



## What shipped (v0.2)



- Multi-token wrap UI: look up any KRC-20 → pay tier-discounted KAS fee → send to shared vault.

- Client wrap history (per tick) + soft deposit verify via Kasplex (`/api/krex-wrap/verify`).

- Public config (`/api/krex-wrap/config`) with per-tick covenant map.

- Hub tier plumbing for wrapped KREX: `queryKREXBalance` total = L1 KRC-20 + L2 ERC-20 + optional KCC20 wrap.

- Bridge modal entry point to the Hub wrap dApp.



## Ops to go live



1. Deploy / assign a **deposit vault** address (keyless burn-in, or Matze-style release vault for later two-way).

2. Set env (see `.env.example`):

   - `NEXT_PUBLIC_KREX_WRAP_VAULT` (shared vault for all ticks)

   - `NEXT_PUBLIC_KREX_WRAP_TREASURY` (optional)

   - `NEXT_PUBLIC_KREX_WRAP_FEE_KAS` (default `2`)

   - `NEXT_PUBLIC_KREX_KCC20_COVENANT_ID` for wrapped KREX

   - `NEXT_PUBLIC_KRC20_WRAP_COVENANTS` JSON map for additional ticks, e.g. `{"GRID":"<64hex>"}`

3. Run a **mint watcher**: scan vault KRC-20 deposits by tick → mint/send that tick's KCC20 1:1 to sender (idempotent).

4. Keep vault KRC-20 holdings per tick ≥ circulating wrapped KCC20 for that tick.



## Hub tiers for wrapped KREX



Yes. Once `NEXT_PUBLIC_KREX_KCC20_COVENANT_ID` is set and kcc20.info (or fallback) returns balances, wrapped KREX is added into `useKREXBalance().balance` and therefore into `getKREXTierFromBalance`. Same fee discounts, Hub points multipliers, and GRID calculator tiers as KRC-20 / L2 KREX.



Other wrapped ticks do not auto-enter the KREX tier table unless product wiring is added for them.



## New KCC20 token vs wrap (product advice)



| Path | Pros | Cons |

|------|------|------|

| **Wrap existing KRC-20** | Keeps one economic supply; holders migrate without abandonment | Needs vault + mint watcher; KRC-20 side is not consensus-trustless |

| **Launch a brand-new KCC20** | Clean covenant-native story; faster narrative vs “old KRC-20” | Splits liquidity and mindshare; old holders feel left behind |



Recommendation: **wrap** when a KRC-20 already has holders. Interest is moving to KCC20 because it is programmable on L1. Meet that demand by wrapping (or a controlled mint that requires burning/locking KRC-20). A second unlinked token accelerates the drop you are seeing.



## Trust model (be honest in UI)



- Not fully on-chain / third-party-free.

- KRC-20 recognition depends on indexers.

- Mint/release depends on the watcher (and later release keys / MPC for unwrap).



## Multi-token registry



Same rails for every tick: shared vault + per-tick KCC20 covenant in `NEXT_PUBLIC_KRC20_WRAP_COVENANTS`, listing/ops fee to add a tick, per-wrap KAS fee. KREX is the default pair.


