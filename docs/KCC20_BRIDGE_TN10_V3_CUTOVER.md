# TN10 v3 keyless migrate cutover

Ops runbook for greenfield ticket-gated TKREX migrate (leave soak asset `83b999…` historical).

## Live TN10 tip (cutover 2026-08-07)

| Field | Value |
|-------|-------|
| Asset covenant | `4c1b883883cc816442bac6bd23621c7b1157a25f5c5ac61caf098ae0004d8106` |
| Controller covenant | `0ebd2c4ba067f6756a142b43be0aacb2d4fbc16c885573ab9ca62d7eb79c1680` |
| Handover tx | `b36bf71e2705306296a7553dc465b0ac83fa8f045d89a8a44b3cbd47a0c677a2` |
| `migrateVersion` | 3 |
| `adminRenounced` | true |

Hub tip file: `data/krex-wrap/migrate-mint-tip-tn10.json` (includes claim templates).

Kascov: https://kascov.io/testnet-10/c/4c1b883883cc816442bac6bd23621c7b1157a25f5c5ac61caf098ae0004d8106

## Prerequisites

- Wallet 3 funded on TN10 (`TKREX_WALLET3_PRIVKEY` or `wallet3.privkey` / `wallet3.privkey.json`)
- Attestor keys: `.attestor{1,2,3}.privkey` (attestor1 = wallet3 after cutover)
- Hub secrets: `KCC20_BRIDGE_WATCHER_SECRET`, `KREX_WRAP_HUB_URL`, `GITHUB_TOKEN` (tip persist)
- `silverc` via `bash scripts/bootstrap-silverc.sh` in `tools/tn10-migrate`

## Steps

1. **Roster** (once): `node scripts/generate-tn10-attestor-roster.mjs`
2. **Compile bundle**: `node scripts/build-tkrex-migrate-bundle.mjs`
3. **Genesis controller + asset** (broadcast with wallet3 key)
4. **Handover**: `node scripts/broadcast-tkrex-migrate-handover.mjs --broadcast --key-file tkrex-migrate-deploy/wallet3.privkey`
5. Point Hub tip + `NEXT_PUBLIC_KCC20_BRIDGE_COVENANTS` at the new asset id
6. Attestor issues tickets (2-of-3); user Claims in Hub

## Attestor GHA (keep in sync)

Workflow: `.github/workflows/tn10-migrate-attestor.yml` (cron `*/10`).

### Set secrets (GitHub UI)

1. Open the Hub repo on GitHub → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** for each name below (values from local cutover files; do not commit them)
3. After regenerating the Vercel watcher secret, paste the **same** value into `KCC20_BRIDGE_WATCHER_SECRET` and `KCC20_MIGRATE_ATTESTOR_SECRET`

| Secret | Source |
|--------|--------|
| `KCC20_BRIDGE_WATCHER_SECRET` | Vercel / `.cutover-watcher-secret.tmp` |
| `KCC20_MIGRATE_ATTESTOR_SECRET` | same as watcher |
| `KREX_WRAP_HUB_URL` | `https://hub.kasparex.com` |
| `TKREX_WALLET3_PRIVKEY` | 64-hex from `wallet3.privkey` |
| `TKREX_ATTESTOR1_PRIVKEY` | `.attestor1.privkey` (wallet3 after cutover) |
| `TKREX_ATTESTOR2_PRIVKEY` | `.attestor2.privkey` |
| `TKREX_ATTESTOR3_PRIVKEY` | `.attestor3.privkey` |

Or CLI (after `gh auth login`): `gh secret set NAME` then paste value.

Then **Actions** → **TN10 migrate attestor** → **Run workflow** once to verify.

Ticket issue uses tx `version=1` with `sigOpCount=0` (same as handover). Optional resume: `TKREX_TICKET_GENESIS_TXID` + `TKREX_TICKET_COVENANT_ID` (do not use P2SH script hash as covenant id).

## Honesty

“Keyless” means sink + post-handover admin mint gone. Attestor keys remain for KRC-20 observation and ticket issue until observation is unnecessary.
