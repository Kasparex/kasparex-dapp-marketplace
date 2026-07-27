# Programmable Token UaaS (KCC-20)

Kasparex Tokens is a **Utility-as-a-Service** layer for programmable L1 assets. We do **not** deploy or launch KCC-20 tokens. Users create covenants on external platforms (KRON, KaspaCom, kascov-lab, etc.), then **connect** them in the Tokens Dashboard.

## What Kasparex provides

| Capability | Where |
|------------|--------|
| List & page-build | `/tokens/dashboard` Create listing flow |
| Connect covenant | Primary network: **L1 Programmable (KCC-20)** |
| External launchpad | **Launch on KRON** CTA in the connect panel ([kron.technology](https://kron.technology)) |
| Verify controller | Token verification wizard (Kaspa signature) |
| On-chain enrichment | Read-only cascade: kcc20.info / KaspaCom / kascov |
| Markets deep-link | Auto-seed **KRON** DEX row on connect; Trade on KRON on the token page |
| Utility modules | Covenant Utilities Hub, Access Gate, Native Subscriptions (placeholder) |
| Hub integrations | Existing Store / vBlog / Games products when payment rails support the token |

## What Kasparex does not provide

- KCC-20 token launcher or deploy wizard (use KRON or another L1 launchpad)
- Covenant indexer or chain follower (no SQLite, no background sync)
- In-Hub mint, transfer, or DEX

See also: [COVENANT_EXTERNAL_INTEGRATION.md](./COVENANT_EXTERNAL_INTEGRATION.md) · [KASCOV_TEMPLATE_MAP.md](./KASCOV_TEMPLATE_MAP.md) ([kascov.io](https://kascov.io)).

## Connect flow (with KRON)

1. Open Tokens Dashboard → **List a Token** → **Real token** → **KCC20 (Kaspa L1)**.
2. Click **Launch on KRON** (opens [kron.technology/launch/new](https://kron.technology/launch/new)), deploy the covenant token there.
3. Copy the KRON token URL (`kron.technology/token/<covenantId>`) or the 64-char covenant id.
4. Paste into the connect field → **Look up covenant** → **Connect token**.
5. Hub prefills ticker/name, enables Markets + Utility, and seeds a KRON market link.
6. Build the page, pay listing fee, **Verify controller** wallet.

### Deep-link return

After you have a covenant id, open:

`/tokens/dashboard?from=kron&covenant=<64-hex>&network=mainnet`

The form switches to Real + KCC20, pastes the id, and auto-looks up.

## Environment

```bash
NEXT_PUBLIC_KASCOV_BASE=https://kascov.io
NEXT_PUBLIC_KCC20_NETWORK=mainnet   # or testnet-10
NEXT_PUBLIC_KRON_BASE=https://kron.technology
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
| KRON helpers | `src/lib/programmable/kron.ts` |
| kascov client | `src/lib/programmable/kascovClient.ts` |
| Eligibility | `src/lib/programmable/eligibility.ts` |
| KCC-20 lookup | `src/lib/tokens/kcc20Lookup.ts` |
| Connect UI | `src/components/tokens/Kcc20ConnectField.tsx` |
| Asset panel | `src/components/tokens/ProgrammableAssetPanel.tsx` |
| Markets editor | `src/components/tokens/TokenMarketsEditor.tsx` |
| Utility panels | `TokenCovenantUtilitiesPanel`, `TokenAccessGatePanel`, `TokenNativeSubscriptionsPanel` |
| KCC20 spec reference | `docs/KCC20_SPEC.md` |

## Smoke test (testnet-10)

1. Deploy or find a covenant indexed on kascov testnet-10.
2. Create a real listing with KCC-20 network and connect the covenant id.
3. Publish listing and verify controller wallet.
4. Unlock **Covenant Utilities Hub** and **Access Gate** modules; confirm Utility tab on `/tokens/[slug]`.
5. Confirm **View on kascov** link on archive card and programmable asset panel.
