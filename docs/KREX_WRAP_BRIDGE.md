# KCC20 Bridge (KRC-20 ↔ KCC20)



Hub dApp: [`/dapps/kcc20-bridge`](../src/components/dapps/KrexWrapBridgeWidget.tsx)



Old URL `/dapps/krex-wrap-bridge` redirects permanently to `/dapps/kcc20-bridge`.



Migrate any KRC-20 into matching KCC20 1:1 via a shared Hub vault. KREX remains the default preselected tick. Users can switch **Mainnet** / **Testnet** in the Migrate tab.



## Public UI rules



- Never show env var names, “Pending ops”, or “Not configured” on the public Metadata tab.

- Only show a vault address when it is actually set.

- No borrowed featured images: omit `featuredImage` so `KxListingFeaturedPlaceholder` renders.



## Liquidity if you deploy on kascov first



kascov is an **indexer / explorer / builder**, not a DEX. Deploying there does not by itself create a buy button.



People buy after you:



1. Add a market on a KCC20-capable DEX (KRON / Kcom / others when they list by covenant id), or

2. Seed Hub Tokens listing + bridge so utility demand exists, then list the covenant id on DEX.



## Deploying wrapped KCC20 (ops)



Do **not** fair-launch a second free-supply copy of an existing KRC-20 on KRON/Kcom. That creates a competing token.



Best path per tick:



1. Deploy a **mint-controlled / capped KCC20** (same decimals as the KRC-20, usually 8; same max supply story).

2. Mint authority = bridge controller only (vault watcher), never open public mint.

3. Circulating KCC20 must never exceed that tick's KRC-20 locked in the vault.

4. Use **KRON / KaspaCom / kascov** afterward for discovery, listing, and trading the wrapped asset, not for inventing new supply.

5. Keep ticker branding aligned so wallets show two rails of the same project, not two projects.



## What shipped (v0.3)



- Multi-token migrate UI + Mainnet / Testnet toggle.

- Client history (per tick + network) + soft deposit verify (`/api/krex-wrap/verify`).

- Public config with per-tick covenant map.

- Hub tier plumbing for wrapped KREX when covenant id is set.

- Bridge modal entry → `/dapps/kcc20-bridge`.



## Ops to go live



1. Deploy / assign deposit vault addresses (mainnet + optional testnet).

2. Set env (see `.env.example`):

   - `NEXT_PUBLIC_KCC20_BRIDGE_VAULT`

   - `NEXT_PUBLIC_KCC20_BRIDGE_VAULT_TESTNET` (optional)

   - `NEXT_PUBLIC_KCC20_BRIDGE_TREASURY` (optional)

   - `NEXT_PUBLIC_KCC20_BRIDGE_FEE_KAS` (default `5`)

   - `NEXT_PUBLIC_KREX_KCC20_COVENANT_ID` / `NEXT_PUBLIC_KCC20_BRIDGE_COVENANTS`

3. Run a **mint watcher**: scan vault KRC-20 deposits by tick → mint that tick's KCC20 1:1 (idempotent).

4. Keep vault holdings per tick ≥ circulating wrapped KCC20 for that tick.



## Trust model



- Not fully on-chain / third-party-free.

- KRC-20 recognition depends on indexers (mainnet `api.kasplex.org`, testnet `tn10api.kasplex.org`).

- Mint/release depends on the watcher.



## Multi-token registry



Shared vault + per-tick KCC20 covenant map. KREX is the default pair.


