# Programmable Token UaaS (KCC-20)

Kasparex Tokens is a **Utility-as-a-Service** layer for programmable L1 assets. We do **not** deploy or launch KCC-20 tokens. Users create covenants on external platforms (KaspaCom, kascov-lab, etc.), then **connect** them in the Tokens Dashboard.

## What Kasparex provides

| Capability | Where |
|------------|--------|
| List & page-build | `/tokens/dashboard` Create listing flow |
| Connect covenant | Primary network: **L1 Programmable (KCC-20)** |
| Verify controller | Token verification wizard (Kaspa signature) |
| On-chain enrichment | Read-only kascov client (`src/lib/programmable/kascovClient.ts`) |
| Utility modules | Covenant Utilities Hub, Access Gate, Native Subscriptions (placeholder) |
| Hub integrations | Existing Store / vBlog / Games products when payment rails support the token |

## What Kasparex does not provide

- KCC-20 token launcher or deploy wizard
- Covenant indexer or chain follower (no SQLite, no background sync)
- In-Hub mint, transfer, or DEX

See also: [COVENANT_EXTERNAL_INTEGRATION.md](./COVENANT_EXTERNAL_INTEGRATION.md)

## Connect flow

1. Deploy a programmable token elsewhere and copy the **covenant id** or **genesis tx id**.
2. Tokens Dashboard → Create listing → **Real token** → **L1 Programmable (KCC-20)**.
3. Paste id → **Look up covenant** (client fetch to [kascov](https://kascov-explorer.web.app) JSON API).
4. Build the page, unlock programmable modules, pay listing fee (unchanged).
5. **Verify controller** wallet to unlock utility modules and directory badges.

## Environment

```bash
NEXT_PUBLIC_KASCOV_BASE=https://kascov-explorer.web.app
NEXT_PUBLIC_KCC20_NETWORK=testnet-10   # or mainnet when ready
```

## Programmable utility modules

| Module | Purpose |
|--------|---------|
| `covenant_utilities_hub` | Link token page to Kasparex covenant dApps (lockbox, split, milestone, crowdfund, voucher) |
| `access_gate` | Holder check via read-only kascov state (v1); wallet-native proofs later |
| `native_subscriptions` | Placeholder for recurring access when L1 payment rails mature |

## Architecture

- **Client-first:** listing metadata in localStorage + optional IPFS + L1 commit payload
- **Read-only chain data:** kascov fetched on page load / manual refresh only
- **Server:** existing `/api/tokens/verify` for listing payments; no new indexer APIs

## Code map

| Area | Path |
|------|------|
| kascov client | `src/lib/programmable/kascovClient.ts` |
| Eligibility | `src/lib/programmable/eligibility.ts` |
| KCC-20 lookup | `src/lib/tokens/kcc20Lookup.ts` |
| Connect UI | `src/components/tokens/Kcc20ConnectField.tsx` |
| Asset panel | `src/components/tokens/ProgrammableAssetPanel.tsx` |
| Utility panels | `TokenCovenantUtilitiesPanel`, `TokenAccessGatePanel`, `TokenNativeSubscriptionsPanel` |
| KCC20 spec reference | `docs/KCC20_SPEC.md` |

## Smoke test (testnet-10)

1. Deploy or find a covenant indexed on kascov testnet-10.
2. Create a real listing with KCC-20 network and connect the covenant id.
3. Publish listing and verify controller wallet.
4. Unlock **Covenant Utilities Hub** and **Access Gate** modules; confirm Utility tab on `/tokens/[slug]`.
5. Confirm **View on kascov** link on archive card and programmable asset panel.
