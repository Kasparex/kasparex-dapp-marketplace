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

1. Compile with `silverc lockbox.sil`.
2. Implement `SilverscriptCovenantRuntime` in `src/lib/covenant/silverscript-runtime.ts`.
3. Set `COVENANT_LAB_CONFIG.runtimeMode = 'silverscript'`.
4. Build txs with WASM SDK v2.x (`covenant`, `computeBudget`, `storageMass`).

See [KCC20 book](https://kaspanet.github.io/silverscript/kcc20-book/) for fungible token patterns; this lockbox is simpler (native KAS only).

## Split payments

See `split-payment.sil` and dApp **Covenant Split** (`/dapps/covenant-split`) for the 1:N fan-out prototype.

## Additional prototypes

| dApp | Reference | Pattern |
|------|-----------|---------|
| Covenant Milestone | `milestone.sil` | Timed staged releases |
| Covenant Crowdfund | `crowdfund.sil` | Goal + deadline assurance |
| Covenant Voucher | `voucher.sil` | Hashlock preimage claim |
