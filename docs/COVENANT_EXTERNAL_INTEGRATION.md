# External dApp integration (L1 covenants)

How third-party Kaspa dApps can interoperate with Kasparex Hub **without** Hub-operated indexers.

## Principles

- **Client-first state**: covenant UTXO refs and vault records live in the user browser (localStorage) or in the external dApp.
- **Wallet-native txs**: Hub does not submit raw txs to nodes; wallets build and sign covenant transactions.
- **On-demand verify**: optional one-shot check via Hub proxy `GET /api/kaspa/transaction/[hash]` (same as donations/rewards).

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
