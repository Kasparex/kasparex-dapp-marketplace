# Kaspa WASM SDK (browser)

Vendored **web/kaspa-core** from rusty-kaspa `kaspa-wasm32-sdk` (Toccata-capable).

Used by Hub’s unsigned covenant tx builder (`src/lib/covenant/builder`) so wallets can `signPskt` without holding private keys in the dApp.

## Refresh

```bash
npm run kaspa:wasm
# or force re-download:
node scripts/ensure-kaspa-wasm.mjs --force
```

## Files

- `kaspa.js` / `kaspa_bg.wasm` – runtime
- `kaspa.d.ts` – upstream types (reference)
