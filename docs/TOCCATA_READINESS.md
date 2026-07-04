# Toccata readiness (Kasparex Hub)

Internal checklist for **Toccata** on Kaspa mainnet. Activated at DAA score `474_165_565` (June 30, 2026). Official guide: [docs.kaspa.org/toccata](https://docs.kaspa.org/toccata).

## Hub scope

Kasparex Hub is a Next.js web app. It does **not** run `kaspad` or operate chain indexers.

| Layer | Hub role | Toccata impact |
|-------|----------|----------------|
| L1 payments | KasWare / Kastle + covenant runtime | Wallets must expose tx v1 covenant APIs |
| L1 reads | `api.kaspa.org` proxy (on-demand tx verify only) | REST must expose `storageMass`, covenant fields |
| Covenant dApps | Pluggable runtime (`simulator` / `silverscript` / `hybrid`) | Real L1 when wallet + artifacts ready |
| L2 (Igra / Kasplex) | Hardhat contracts | Not affected by Toccata |

## Runtime configuration

Set in Vercel or `.env.local`:

```bash
NEXT_PUBLIC_COVENANT_RUNTIME=simulator   # default, local dev
NEXT_PUBLIC_COVENANT_RUNTIME=hybrid     # try L1, fall back to simulator
NEXT_PUBLIC_COVENANT_RUNTIME=silverscript # L1 only (requires wallet + artifacts)
```

Compile Silverscript artifacts (when `silverc` is available):

```bash
npm run covenant:compile
```

Outputs: `public/covenant/*.json`

## Wallet capability checklist

- [ ] KasWare exposes `sendCovenantTransaction` or equivalent tx v1 covenant builder
- [ ] Kastle exposes covenant transaction APIs
- [ ] Wallets use post-Toccata minimum fee estimation
- [ ] `silverc` mainnet output committed to `public/covenant/` (`scriptHex` populated)

## Hub smoke tests (after wallets ready)

- [ ] Covenant Lab: create lockbox + claim on mainnet
- [ ] Covenant Split: fan-out create + recipient claim
- [ ] Send KAS (non-covenant flows unchanged)
- [ ] CrowdKAS L1 covenant panel pledge + claim/refund paths

## Architecture (in repo)

| Module | Path |
|--------|------|
| Programmability core | `src/lib/programmability/` |
| Covenant runtimes | `src/lib/covenant/` (`resolver.ts`, `silverscript-runtime.ts`, …) |
| Wallet adapter | `src/lib/kaspa/wallet.ts` (`sendCovenantTransaction`) |
| Silverscript sources | `covenant-lockbox/*.sil` |
| Static artifacts | `public/covenant/*.json` |
| External integration | `docs/COVENANT_EXTERNAL_INTEGRATION.md` |

## Fee rule (wallet / manual builders)

After activation: `100 sompi × max(compute grams, 2 × transaction bytes)`

Hub users rely on wallet fee estimation for standard sends; covenant runtime delegates fees to the wallet.

## Reference KIPs

[KIP-16](https://github.com/kaspanet/kips/blob/master/kip-0016.md), [KIP-17](https://github.com/kaspanet/kips/blob/master/kip-0017.md), [KIP-20](https://github.com/kaspanet/kips/blob/master/kip-0020.md), [KIP-21](https://github.com/kaspanet/kips/blob/master/kip-0021.md)

## Fungible tokens on L1 (KCC20)

Optional covenant token interface (not required for non-token covenants): [KCC20_SPEC.md](./KCC20_SPEC.md)

Programmable token **listing and UaaS** (connect, verify, utility modules): [PROGRAMMABLE_TOKEN_UAAS.md](./PROGRAMMABLE_TOKEN_UAAS.md)
