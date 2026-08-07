# TN10 v3 keyless migrate cutover

Ops runbook for greenfield ticket-gated TKREX migrate (leave soak asset `83b999…` historical).

## Prerequisites

- Wallet 3 funded on TN10 (`TKREX_WALLET3_PRIVKEY`)
- Attestor keys: `.attestor1.privkey` … `.attestor3.privkey` (or `TKREX_ATTESTOR{1,2,3}_PRIVKEY`)
- Hub secrets: `KCC20_BRIDGE_WATCHER_SECRET`, `KREX_WRAP_HUB_URL`, `GITHUB_TOKEN` (tip persist)
- `silverc` via `bash scripts/bootstrap-silverc.sh` in `tools/tn10-migrate`

## Steps

1. **Roster** (once):
   ```bash
   node scripts/generate-tn10-attestor-roster.mjs
   ```

2. **Compile bundle**:
   ```bash
   node scripts/build-tkrex-migrate-bundle.mjs
   ```
   Writes `template-parts.json`, `ticket-template-parts.json`, `controller-template-parts.json`.

3. **Genesis controller + asset** (broadcast with wallet3 key).

4. **Handover** (renounce admin mint):
   ```bash
   node scripts/broadcast-tkrex-migrate-handover.mjs --broadcast --key-file tkrex-migrate-deploy/wallet3.privkey
   ```
   Tip must include `migrateVersion: 3`, `adminRenounced: true`, and the three template objects.

5. **POST Hub tip** (`?mode=mint-tip`) with Authorization bearer watcher secret. Include templates so Hub Claim can assemble without silverc.

6. **Leave soak tip historical**: keep `83b999…` rows as `legacyNote` / do not overwrite with v3 tip unless cutover is intentional.

7. **Attestor**:
   - With v3 tip live, attestor **issues MigrateTicket** (2-of-3) and POSTs `ticketId` as `txid:index`.
   - Set `KCC20_MIGRATE_AUTO_MINT=0` (or leave AUTO_MINT on only while tip is still soak v2).
   - GHA needs attestor privkeys for ticket issue (not only wallet3).

8. **User Claim** in Hub History: spends ticket + mints (wallet signs ticket redeem + funding).

## Ticket issue (manual)

```bash
TKREX_BURN_TXID=<64hex> \
TKREX_MINT_AMOUNT_RAW=<raw> \
TKREX_CLAIMANT_PUBKEY=<xonly> \
node scripts/broadcast-tkrex-migrate-ticket-issue.mjs --broadcast
```

## Honesty

“Keyless” means sink + post-handover admin mint gone. Attestor keys remain for KRC-20 observation and ticket issue until observation is unnecessary.
