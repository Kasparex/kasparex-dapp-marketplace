# Covenant Lockbox (Silverscript reference)

Experimental reference for the Hub **Covenant Lab** widget. Not deployed on mainnet until Toccata + Silverscript are live on TN12/mainnet.

## Concept

A single covenant UTXO carries:

- `amount` (sompi locked)
- `beneficiary` (pubkey hash)
- `unlockTime` (0 = escrow / immediate claim eligibility)
- `depositor` (for audit)

Transitions:

1. **Lock** (genesis): fund output with covenant script + initial state.
2. **Claim**: beneficiary spends with signature; if timelock, `tx.time >= unlockTime`.

The Hub simulator mirrors this state machine in `src/lib/covenant/simulator.ts`.

## Future wiring

1. Compile with `silverc lockbox.sil` or `npm run covenant:compile`.
2. Runtime: `src/lib/covenant/silverscript-runtime.ts` (registered in `resolver.ts`).
3. Set `NEXT_PUBLIC_COVENANT_RUNTIME=silverscript` or `hybrid`.
4. Wallets expose `sendCovenantTransaction` (tx v1: `covenant`, `computeBudget`, `storageMass`).

## Quine reference (educational)

`quine.sil` documents the [KaspaKii](https://x.com/KaspaKii/status/2071995662867066890) self-replicating covenant pattern: singleton transition that preserves state and **covenant ID** across generations. Use for internal tx-builder validation, not as a Hub product.

See [KCC20 book](https://kaspanet.github.io/silverscript/kcc20-book/) for fungible token patterns; lockbox is native KAS only.

## Split payments

See `split-payment.sil` and dApp **Covenant Split** (`/dapps/covenant-split`) for the 1:N fan-out prototype.

kascov visibility: [docs/KASCOV_TEMPLATE_MAP.md](../docs/KASCOV_TEMPLATE_MAP.md) (canonical explorer: [kascov.io](https://kascov.io)).

## Additional prototypes

| dApp | Reference | Pattern |
|------|-----------|---------|
| Covenant Milestone | `milestone.sil` | Timed staged releases |
| Covenant Crowdfund | `crowdfund.sil` | Goal + deadline assurance |
| Covenant Voucher | `voucher.sil` | Hashlock preimage claim |
