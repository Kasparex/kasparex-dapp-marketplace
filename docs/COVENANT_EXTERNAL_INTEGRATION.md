# External dApp integration (L1 covenants)

How third-party Kaspa dApps can interoperate with Kasparex Hub **without** Hub-operated indexers.

## Principles

- **Client-first state**: covenant UTXO refs and vault records live in the user browser (localStorage) or in the external dApp.
- **Wallet signing**: Prefer the KasCoven / KIP-12 pattern: build unsigned Safe-JSON, `signPskt` user inputs only, then `pushTx`. Optional fast path: wallet `sendCovenantTransaction`.
- **On-demand verify**: optional one-shot check via Hub proxy `GET /api/kaspa/transaction/[hash]` (same as donations/rewards).

## Wallet submit flow

Aligned with [KasCoven Vaults](https://vaults.kaslab.space/) and KIP-12:

1. Hub builds an unsigned Safe-JSON transaction (`src/lib/covenant/builder` + `public/kaspa-sdk` WASM).
2. Ask the wallet to `signPskt` only the user-owned inputs (leave covenant scripts untouched).
3. Broadcast via wallet `pushTx` (or equivalent).

Deploy and spend/claim builders are implemented for Hub templates that ship `scriptHex`. Spend/claim needs a wallet that can sign the redeem script (`signPskt` + `scripts`) so Hub can wrap the SilverScript ABI P2SH unlock.

Your dApp can also call `window.kasware` / `window.kastle` APIs when available.

## Integration patterns

### 1. Iframe embed + SIWK

Embed your dApp in the Hub directory or link from `dapps.ts`. Users connect via Kasparex wallet gate (KasWare / Kastle + SIWK).

### 2. Wallet gate only

Use Hub open patterns:

- `evaluateHubAccess()` from `src/lib/hub/access.ts`
- `HubWalletGateShell` for section gating

Your dApp calls `window.kasware` / `window.kastle` covenant APIs when available.

### 3. Shared runtime types (internal)

External repos can mirror types from `src/lib/programmability/types.ts`:

- `CovenantTxRequest`, `CovenantBinding`, `UtxoOutpoint`
- Artifact layout in `public/covenant/*.json`

**Programmable token listings (KCC-20):** connect by covenant id in the Tokens Dashboard; read-only enrichment via [kascov](https://kascov.io). See [PROGRAMMABLE_TOKEN_UAAS.md](./PROGRAMMABLE_TOKEN_UAAS.md) and [KASCOV_TEMPLATE_MAP.md](./KASCOV_TEMPLATE_MAP.md). No Hub indexer.

No npm package yet; copy types or consume artifacts JSON from a deployed Hub URL.

### 4. postMessage bridge (optional)

Parent Hub page and iframe dApp can exchange:

```json
{ "type": "kpx-covenant-tx", "txHash": "...", "template": "lockbox" }
```

Hub does not validate lineage at scale; dApp verifies its own tx hash via REST if needed.

## Runtime modes

| Mode | Behavior |
|------|----------|
| `simulator` | Local state only (dev/demo) |
| `silverscript` | Real L1 covenant txs via wallet |
| `hybrid` | Try L1; fall back to simulator if wallet lacks support |

Configure with `NEXT_PUBLIC_COVENANT_RUNTIME` on deployed Hub.

## What Hub does not provide

- Covenant marketplace discovery or chain scanning
- Persistent server-side vault registry
- Kaspalytics or custom indexer APIs

## Related files

- `src/lib/covenant/resolver.ts` - runtime factory
- `src/lib/programmability/tx-builder.ts` - wallet covenant submit
- `covenant-lockbox/README.md` - Silverscript reference contracts
