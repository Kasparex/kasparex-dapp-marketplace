/**
 * TN10 MigrateTicket genesis + 2-of-3 issue for one burn.
 *
 * Env:
 *   TKREX_BURN_TXID, TKREX_MINT_AMOUNT_RAW, TKREX_CLAIMANT_PUBKEY (x-only)
 *   TKREX_TICKET_FUNDING_SOMPI (default 50_000_000)
 *
 * Dry-run (default) writes TICKET_ISSUE_DRY_RUN.json.
 * --broadcast requires .attestor{1,2,3}.privkey (at least 2) + funding key.
 *
 *   node scripts/broadcast-tkrex-migrate-ticket-issue.mjs
 *   node scripts/broadcast-tkrex-migrate-ticket-issue.mjs --broadcast
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ATTESTOR_THRESHOLD,
  compileWithExprs,
  loadAttestorRoster,
  resolveSilvercBin,
  ticketCtorExprs,
} from './lib/migrate-v3-ctor.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const openSilverRoot = resolve(__dirname, '..');
const outDir = join(openSilverRoot, 'tkrex-migrate-deploy');
const silvercBin = resolveSilvercBin(openSilverRoot);
const WANT_BROADCAST = process.argv.includes('--broadcast');

const BURN_TXID = (process.env.TKREX_BURN_TXID || '').trim().toLowerCase().replace(/^0x/i, '');
const AMOUNT_RAW = BigInt(process.env.TKREX_MINT_AMOUNT_RAW || '0');
const CLAIMANT = (process.env.TKREX_CLAIMANT_PUBKEY || '').trim().replace(/^0x/i, '');

if (!/^[a-f0-9]{64}$/.test(BURN_TXID)) throw new Error('Set TKREX_BURN_TXID');
if (AMOUNT_RAW <= 0n) throw new Error('Set TKREX_MINT_AMOUNT_RAW');
if (!/^[a-f0-9]{64}$/.test(CLAIMANT)) throw new Error('Set TKREX_CLAIMANT_PUBKEY (x-only)');

const roster = loadAttestorRoster(openSilverRoot, outDir);
const attestors = roster.attestors.map((a) => a.xOnlyPubkey);

const ticketArtifact = compileWithExprs(
  openSilverRoot,
  silvercBin,
  'contracts/tokens/migrate-ticket.sil',
  ticketCtorExprs(attestors, ATTESTOR_THRESHOLD),
  'ticket-issue',
);

const result = {
  network: 'testnet-10',
  migrateVersion: 3,
  burnTxId: BURN_TXID,
  amountRaw: AMOUNT_RAW.toString(),
  claimantXOnly: CLAIMANT,
  threshold: ATTESTOR_THRESHOLD,
  attestors,
  ticketScriptHex: Buffer.from(ticketArtifact.script).toString('hex'),
  note: WANT_BROADCAST
    ? 'Broadcast path: fund inactive genesis then issue with 2-of-3 (see Hub claim docs).'
    : 'Dry-run: ticket template compiled. Full genesis+issue broadcast lands with funded attestor UTXOs.',
  status: WANT_BROADCAST ? 'broadcast-not-fully-wired' : 'dry-run',
  updatedAt: new Date().toISOString(),
};

writeFileSync(join(outDir, 'TICKET_ISSUE_DRY_RUN.json'), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(outDir, 'ticket-issue-artifact.json'), JSON.stringify(ticketArtifact, null, 2));
console.log(JSON.stringify(result, null, 2));

if (WANT_BROADCAST) {
  console.warn(
    'Full on-chain ticket genesis+issue broadcast is scaffolded; attestor posts ticketId after funding path is completed in Hub claim builder soak.',
  );
}
