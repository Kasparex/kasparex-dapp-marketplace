# KCC20 Bridge v2: keyless one-way migrate

Status: **architecture target** (TN10 testing ground; no production users yet).  
Product surface: `/dapps/kcc20-bridge`  
Companion ops doc (current v1 vault+watcher): [KREX_WRAP_BRIDGE.md](./KREX_WRAP_BRIDGE.md)

Reference demo (Kascov / Knitser, TN10, 2026-08-06):  
https://x.com/0xKnitser/status/2085226857759465824

## Implementation status (2026-08-06)

Shipped in Hub + OpenSilver (TN10 soak, N=1 attestor honesty):

| Piece | Status |
|-------|--------|
| Architecture invariants | Locked in this doc |
| Keyless sink v1 (P2SH OP_RETURN) | `data/krex-wrap/migrate-sink-v1.json` + default Hub config |
| Hub Migrate UI Burn → Attest → Minted | `/dapps/kcc20-bridge` with `migrateV2Enabled` default ON (`NEXT_PUBLIC_KCC20_MIGRATE_V2=0` to force v1) |
| Attestation API + nullifier store | `/api/krex-wrap/attestations`, `data/krex-wrap/attestations-tn10.json` |
| OpenSilver `KCC20Migrate` | `contracts/tokens/kcc20-migrate.sil` (attestor mint, handover, burnTxId, controller continues) |
| Compile + runtime tests | `tests/tokens/kcc20-migrate-compile.test.ts`, `kcc20_migrate_handover_and_attestor_mint_continues_controller` |
| Attestor script | OpenSilver `scripts/tkrex-migrate-attestor.mjs` |

Still open before calling it fair for real funds:

- Deploy fresh TN10 migrate covenants (do not reuse admin-minted `c9d0799b…` as the fairness asset)
- Ticket UTXO consensus replay (today: attestor nullifier)
- User-signed claim txs (today: optional attestor-assisted mint via `KCC20_MIGRATE_AUTO_MINT=1`)
- N-of-M independent attestors + dual indexers + soak

## Goal

Migrate KRC-20 → matching KCC20 **1:1**, as **automatic**, **fair**, and **operator-free** as Kaspa L1 allows today.

Hard requirements:

1. **No mint without a prior accepted KRC-20 burn** (observation of an executed op, never a prediction).
2. **No secret extra mint**: circulating KCC20 ≤ burned KRC-20 for that tick, enforceable on-chain for the mint leg.
3. **No spendable vault**: burned units must go to a **keyless sink** (no Kasparex key can recover them).
4. **No Kasparex mint key after handover**: mint authority belongs to a **covenant**, not wallet 3.
5. **Replay-safe without a Hub registry**: second claim against the same burn is a **double-spend of a ticket outpoint**.
6. **One-way by construction**: no unwrap / return path in v2.
7. **User signs their own claim**: Hub / attestor must never hold a hot key that signs claim txs for the user in production.

Non-goals for v2:

- Two-way bridge / liquidity return to KRC-20.
- Trusting a single Kasparex process as both indexer and mint signer (that is v1).
- Pretending KRC-20 burns are consensus-native (they are not; see trust surface below).

## Why v1 is not good enough

| Surface | v1 today | Attack / failure |
|---------|----------|------------------|
| Deposit destination | Spendable **vault** (wallet 1) | Operator (or stolen key) can move vault KRC-20 without minting |
| Mint authority | **Wallet 3** admin key on `KCC20Capped` | Operator can mint without any deposit |
| Replay / eligibility | Hub JSON receipts + watcher secret | Receipts can be forged, withheld, or diverge from chain |
| Automation | Operator host runs `tkrex-mint-watcher.mjs` | Process down = stuck users; process rogue = unfair mint |
| Fairness claim | “Policy: mint 1:1 against vault” | Policy is social, not consensus |

v1 proved UX and TN10 plumbing (TKREX deposits, mints, History). It does **not** meet the fairness bar for real tokens.

## Target invariants (Kascov-aligned)

These are the mechanisms we adopt. Names may differ; the invariants must not.

```text
1. Burn FIRST
   User burns KRC-20 to a published keyless sink.
   Attestation covers an op that already executed and was accepted (opAccept).

2. Ticket = burn outpoint (or equivalent unique spendable claim input)
   Mint transaction spends that ticket exactly once.
   Kaspa consensus rejects a second claim as a double-spend.
   No Hub registry required for replay protection.

3. Covenant mint authority
   After handover, deploy / admin keys have zero power over supply.
   Anyone can verify that from chain.

4. One-way
   Sink has no spend path. No reverse vault. No unwrap flag.
```

### Fairness properties we must be able to audit

For tick `T` on network `N`:

- `sum(KCC20 minted)` ≤ `sum(KRC-20 burned to sink with opAccept)` (modulo known dust / fee policy if any).
- Every mint tx reveals the spent burn ticket; explorers can map mint → burn.
- Remaining max supply on the KCC20 controller equals `cap - minted`, and minted only grows via claim spends.
- After handover, no pubkey in the mint path can increase supply alone.

## Honest trust surface (do not paper over this)

KRC-20 is **indexer protocol**, not Kaspa consensus. A pure covenant cannot “see” a KRC-20 burn by itself.

Therefore v2 still needs an **observation layer** for the burn:

| Layer | Trust | Role |
|-------|--------|------|
| Kaspa consensus | Strong | Consumes ticket outpoint once; validates covenant mint rules |
| KRC-20 indexers | Medium | Decide whether burn op is `opAccept` (not merely `txAccept`) |
| Attestor committee | Medium → Strong with N-of-M | Sign that burn `B` with amount `A` to sink `S` is accepted; that signature unlocks / creates the claim ticket used by the covenant |
| Hub UI / API | Weak (replaceable) | Helps build txs, show status; **must not** be mint authority |

Ultra-fair target for attestors:

- **≥ 5 independent, publicly identified, bonded** operators (not five seeds in one process).
- Equivocation slashable (testnet bounty collected by a stranger before mainnet).
- Attestor software open-sourced; third party rebuilds to a published hash.
- **≥ 2 independently bootstrapped indexers** with divergence detection.
- Published ticker policy (included / excluded ticks + arithmetic).

Until those exist: label the product **demo / TN10 soak**, never “trustless mainnet ready.”

Kasparex goal: **reduce Kasparex to zero special authority** (not necessarily zero attestors). Ideal end-state: Kasparex runs zero required attestor seats; community / bonded set does. Hub is optional UX.

## Architecture

### Components

```text
┌──────────────┐     KRC-20 burn      ┌─────────────────┐
│ User wallet  │ ───────────────────► │ Keyless sink    │
└──────┬───────┘                      │ (no spend key)  │
       │                              └────────┬────────┘
       │ claim (user-signed)                   │ observed
       ▼                                       ▼
┌──────────────┐   quorum attest    ┌─────────────────┐
│ Claim Writer │ ◄───────────────── │ Attestors N-of-M │
│ (Hub assist) │                    │ + dual indexers  │
└──────┬───────┘                    └─────────────────┘
       │ spends ticket + mint covenant path
       ▼
┌──────────────────────────────────────────────────────┐
│ KCC20 migrate covenants (controller + minter)        │
│ - mint only with valid ticket + attest               │
│ - controller always recreated (no brick-on-first)    │
│ - admin key renounced after handover                 │
└──────────────────────────────────────────────────────┘
```

### On-chain pieces (OpenSilver / SilverScript)

Replace admin-keyed `KCC20Capped` mint-from-wallet-3 with a **migrate mint** template:

1. **Controller cell**
   - Tracks remaining allowance / cap.
   - **Must return** on every successful claim (Kascov brick lesson: first claim consumed controller and a redeployed controller has a new id → remaining supply forever unmintable).
   - Funded with enough KAS for KIP-9 storage mass (dust cells fail).

2. **Minter cell**
   - Owned by controller covenant id (not by a pubkey).
   - Continues zero-amount minter branch; creates recipient branch for claimed amount.

3. **Ticket / claim input**
   - Created as a consequence of the attested burn (exact encoding TBD with OpenSilver: outpoint spend, covenant-bound attestation UTXO, or equivalent).
   - Consensus one-time spend = replay protection.

4. **Handover**
   - Deploy key initializes parameters (tick mapping, sink address commitment, attestor roster hash, cap, decimals).
   - Explicit renounce / transfer of mint path to covenant-only.
   - After handover, publish proof checklist for explorers.

### Off-chain pieces

1. **Attestor**
   - Watches sink burns for allowlisted ticks.
   - Requires `opAccept` (ignore `txAccept`-only ghosts).
   - Emits signed attestation (amount, tick, burn tx id, sink, claimant pubkey/address rule).
   - Never signs user claim txs.

2. **Dual indexer clients**
   - Kasplex + second independent KRC-20 reader (or second Kasplex bootstrap / alternate API once available).
   - Quorum refuses to attest on divergence.

3. **Hub**
   - Migrate tab: burn helper → wait for attest → build claim → user signs → broadcast.
   - History: derive status from chain (burn, ticket spent, mint) where possible; Hub receipts become **cache only**, not authority.
   - Fee: optional KAS fee to treasury can stay as UX tax; it must not gate mint fairness (or must be encoded in claim rules if required).

### Explicitly removed in v2

- Spendable deposit vault as the source of truth.
- Wallet-3 mint authority for the wrapped asset.
- Watcher that both detects deposits **and** signs mints.
- Hub `mint-receipts` as the only replay lock.
- Any “Pending ops / vault not configured” public copy (already forbidden); v2 public UI shows sink address + covenant ids + attest quorum size only.

## Current vs target (TKREX TN10)

| Item | v1 (live test) | v2 target |
|------|----------------|-----------|
| KRC-20 tick | `TKREX` | New burn-to-sink migration (prefer **fresh** KCC20 asset; old admin-minted TKREX KCC20 is legacy) |
| Deposit | Vault `kaspatest:qrwa6q8…` | Published **keyless sink** address |
| Mint key | Wallet 3 | Covenant after handover |
| Replay | `data/krex-wrap/mint-receipts-tn10.json` | Ticket outpoint spend |
| Automation | Operator watcher | Attestors + user-signed claim (Hub optional builder) |
| Reverse | Flag-gated unwrap (off) | None |
| Cap story | Admin can mint up to cap | Cap only unlocks via burn tickets |

**Break-glass on TN10:** Hub is a testing ground. We will **not** preserve v1 vault deposits as claimable under v2. Legacy v1 mints remain historical. Document them as non-migratable under the new covenants.

## Threat model (must pass)

| Threat | Mitigation |
|--------|------------|
| Operator mints without burn | Impossible after handover: no admin mint entrypoint |
| Operator steals deposits | No deposits: burn sink has no key |
| Double claim same burn | Ticket outpoint consumed once |
| Attestor lies about burn | N-of-M + dual indexers + bonding/slashing; public attest logs |
| Attestor censors claims | Anyone with quorum signatures can claim; roster replaceable via governance rules if designed in |
| Indexer accepts invalid KRC-20 op | Require `opAccept`; second indexer; published fee rules (1000 KAS deploy / 1 KAS mint pitfalls) |
| Controller bricked after first claim | Covenant tests: controller always recreated; soak + second-claim test mandatory |
| Dust / mass invalid cells | Floor KAS per covenant cell (KIP-9); compute budget not over-reserved |
| Server signs for user | Forbidden in prod; claim path is wallet-signed only |
| Secret second supply | Single capped migrate asset; no fair-launch / premint; ticker policy published |

## Phased delivery (TN10 first)

### Phase 0: Spec lock (this doc + OpenSilver design)

- Freeze invariants above.
- Choose ticket encoding + attestation message format.
- Write controller “always return” property as a failing test first.
- Decide sink address derivation (script with no key path, or provably unspendable pattern) and publish it.

### Phase 1: Covenant prototype (OpenSilver)

- Compile migrate controller + minter.
- Genesis + handover on TN10 with **throwaway** tick or new covenant id (do not extend admin mint on `c9d0799b…` if admin key remains powerful).
- Unit / runtime tests:
  - claim succeeds once
  - second claim fails (double-spend)
  - mint amount ≠ burn amount fails
  - controller present after claim N
  - post-handover admin mint fails

### Phase 2: Attestor MVP (still honest about trust)

- Start with **N=1** only on TN10 to prove wiring (same honesty as Kascov: mechanism, not trust model).
- Immediately design for N-of-M message format so swapping to 5-of-5 does not redeploy the token.
- Never server-sign user claims, even on TN10 if avoidable (prefer wallet extension / local signer from day one).

### Phase 3: Hub cutover

- Migrate tab talks to **sink + claim**, not vault + watcher.
- Remove / archive `tkrex-mint-watcher.mjs` mint authority path.
- Receipts API becomes optional indexer cache.
- Env: sink address, asset covenant id, attestor roster hash / endpoints, no vault mint key.

### Phase 4: Soak before any mainnet talk

- Unattended soak: many claims, restarts, malicious second-claim attempts, mass/fee edge cases.
- Attempt to brick (controller lifecycle, mass limits).
- Independent rebuild of attestor to published hash.
- Only then discuss mainnet KREX migrate covenants.

### Phase 5: Trust upgrade (mainnet gate)

- 5 independent bonded attestors.
- Equivocation slash demo on TN10 by a third party.
- Dual indexer divergence detection live.
- Legal / ticker policy published.
- Kasparex holds **0** required seats if possible.

## Hub env shape (target)

Public (safe):

```bash
NEXT_PUBLIC_KCC20_MIGRATE_NETWORK=testnet-10
NEXT_PUBLIC_KCC20_MIGRATE_TICK=TKREX
NEXT_PUBLIC_KCC20_MIGRATE_SINK=<kaspatest:… keyless>
NEXT_PUBLIC_KCC20_MIGRATE_ASSET=<64hex covenant id>
NEXT_PUBLIC_KCC20_MIGRATE_CONTROLLER=<64hex>
NEXT_PUBLIC_KCC20_MIGRATE_ATTEST_QUORUM=1   # raise to 5 later
NEXT_PUBLIC_KCC20_MIGRATE_ATTESTORS=["…","…"]
NEXT_PUBLIC_KCC20_BRIDGE_FEE_KAS=5          # optional UX fee only
```

Removed as authorities:

- `NEXT_PUBLIC_KCC20_BRIDGE_VAULT*` as mint eligibility source
- Watcher mint key / `KCC20_BRIDGE_WATCHER_SECRET` as mint gate
- Admin mint scripts for the migrate asset after handover

## TN10 cutover checklist (Kasparex)

Treat as greenfield; no user funds to protect.

1. Freeze v1: stop watcher; mark vault deposits non-claimable under v2.
2. Publish sink address + burn instructions for `TKREX` (or a new test tick if KRC-20 redeploy is cleaner).
3. Deploy migrate covenants; run handover; verify admin mint dead on-chain.
4. Wire attestor MVP + dual read of `opAccept`.
5. Hub UI: Burn → Attested → Claim (user sign) → Minted.
6. Automated tests: second claim, wrong amount, pre-handover vs post-handover.
7. Soak ≥ days/weeks with intentional abuse clicks (Kascov found the brick by claiming twice).
8. Public status page: supply burned vs minted, roster, covenant ids (no ops/env language).

## Relation to Kascov

We should:

- Reuse their **invariants** (burn-first, ticket spend, covenant mint, honesty about committee).
- Prefer open / reproducible attestor + templates when they publish hashes.
- Not wait passively: implement the same invariants in OpenSilver for Kasparex control of TKREX/KREX product timeline.
- Stay compatible in spirit so users and auditors can compare both demos against the same fairness checklist.

We should not:

- Copy a 1-of-1 committee and call it keyless.
- Ship mainnet while Kasparex is the only attestor and mint path.
- Ignore their brick / mass / `opAccept` lessons.

## Decision log

| Date | Decision |
|------|----------|
| 2026-08-06 | Adopt keyless one-way migrate as v2 target; Hub is testing ground; v1 vault+watcher is transitional only |
| 2026-08-06 | Fairness bar: no mint without burn, no secret mint, no spendable vault, covenant mint after handover, user-signed claims |
| 2026-08-06 | Attestors remain until KRC-20 observation is unnecessary; minimize Kasparex seats to zero for mainnet gate |

## Next engineering action

1. OpenSilver: design note + failing tests for controller-return + ticket-gated mint (Phase 0→1).
2. Specify attestation message + ticket UTXO layout.
3. Hub: stub Migrate UI states (Burn / Wait attest / Claim) behind a feature flag, pointing at sink not vault.
