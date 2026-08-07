# TN10 migrate host bundle (Hub-owned soak runner)

Self-contained OpenSilver subset for GitHub Actions attest + ticket path.
Keep in sync with OpenSilver scripts/contracts when those change.

Workflow: `.github/workflows/tn10-migrate-attestor.yml`

## v3 (ticket + 2-of-3)

```bash
# In OpenSilver (or here if silverc bootstrapped):
node scripts/generate-tn10-attestor-roster.mjs
node scripts/build-tkrex-migrate-bundle.mjs
# genesis → asset init → handover → attestor --once (AUTO_MINT unset)
# User Claims in Hub when attestation.ticketId is txid:index
```

Contracts: `contracts/tokens/migrate-ticket.sil`, `kcc20-migrate.sil`  
Never commit `.attestor*.privkey` or `wallet3.privkey`.
