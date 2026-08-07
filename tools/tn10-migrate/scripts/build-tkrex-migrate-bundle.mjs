/**
 * Build TN10 TKREX KCC20Migrate v3 + MigrateTicket compile artifacts.
 *
 * Roster: 2-of-3 (see ATTESTOR_ROSTER.json). Cap: 1e6 TKREX * 8 decimals.
 *
 *   node scripts/build-tkrex-migrate-bundle.mjs
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TOTAL_CAP,
  ATTESTOR_THRESHOLD,
  compileWithExprs,
  hexToByteArrayExpr,
  loadAttestorRoster,
  migrateControllerExprs,
  resolveSilvercBin,
  templateFromCompiledArtifact,
  ticketCtorExprs,
} from './lib/migrate-v3-ctor.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = join(repoRoot, 'tkrex-migrate-deploy');
const legacyMeta = join(repoRoot, 'tkrex-deploy/TKREX_KASCOV_METADATA.json');
const silvercBin = resolveSilvercBin(repoRoot);

function loadKascovMetadata() {
  const hubMeta = resolve(repoRoot, '../DAPPS/kasparex-connect-wallet/data/krex-wrap/tkrex-kascov-metadata.json');
  for (const p of [hubMeta, legacyMeta, join(outDir, 'TKREX_KASCOV_METADATA.json')]) {
    if (!existsSync(p)) continue;
    return JSON.parse(readFileSync(p, 'utf8'));
  }
  return {
    name: 'Test KREX',
    ticker: 'TKREX',
    image: 'https://hub.kasparex.com/tokens/tkrex.png',
    image_hash: 'b1bc81036057d6e831e369b75a12178426a046991921c6d6113d3bca5c62472e',
  };
}

function main() {
  mkdirSync(outDir, { recursive: true });
  const kascov = loadKascovMetadata();
  writeFileSync(join(outDir, 'TKREX_KASCOV_METADATA.json'), `${JSON.stringify(kascov, null, 2)}\n`);

  const roster = loadAttestorRoster(repoRoot, outDir);
  const attestors = roster.attestors.map((a) => a.xOnlyPubkey);
  const admin = roster.adminXOnlyPubkey;

  const assetProbeExprs = [
    hexToByteArrayExpr('00'.repeat(32)),
    { kind: 'int', data: 0 },
    { kind: 'byte', data: 0x02 },
    { kind: 'bool', data: true },
    { kind: 'int', data: 2 },
    { kind: 'int', data: 2 },
  ];
  const assetProbe = compileWithExprs(repoRoot, silvercBin, 'contracts/tokens/kcc20.sil', assetProbeExprs, 'asset');
  writeFileSync(join(outDir, 'asset-probe.json'), JSON.stringify(assetProbe, null, 2));
  const assetTemplate = templateFromCompiledArtifact(repoRoot, outDir, assetProbe);
  writeFileSync(join(outDir, 'template-parts.json'), JSON.stringify(assetTemplate, null, 2));

  const ticketProbe = compileWithExprs(
    repoRoot,
    silvercBin,
    'contracts/tokens/migrate-ticket.sil',
    ticketCtorExprs(attestors, ATTESTOR_THRESHOLD),
    'ticket',
  );
  writeFileSync(join(outDir, 'ticket-probe.json'), JSON.stringify(ticketProbe, null, 2));
  const ticketTemplate = templateFromCompiledArtifact(repoRoot, outDir, ticketProbe);
  writeFileSync(join(outDir, 'ticket-template-parts.json'), JSON.stringify(ticketTemplate, null, 2));

  const placeholderCovid = '00'.repeat(32);
  const preInitExprs = migrateControllerExprs({
    adminPubkey: admin,
    attestors,
    threshold: ATTESTOR_THRESHOLD,
    totalCap: TOTAL_CAP,
    remainingAllowance: TOTAL_CAP,
    assetCovid: placeholderCovid,
    initialized: false,
    adminRenounced: false,
    assetTemplate,
    ticketTemplate,
  });
  const controllerArtifact = compileWithExprs(
    repoRoot,
    silvercBin,
    'contracts/tokens/kcc20-migrate.sil',
    preInitExprs,
    'controller',
  );

  const summary = {
    network: 'testnet-10',
    tick: 'TKREX',
    decimals: 8,
    controllerKind: 'migrate-v3',
    migrateVersion: 3,
    attestorThreshold: ATTESTOR_THRESHOLD,
    totalCapHuman: TOTAL_CAP / 100_000_000,
    totalCapRaw: TOTAL_CAP,
    note:
      'KCC20Migrate v3: ticket-gated mint, 2-of-3 roster, handover after genesis. AUTO_MINT off; attestors issue tickets only.',
    wallet3Address: 'kaspatest:qqn2344wcpyrp3w4jx8dc6zd0mn2ml4glgn84ufwv7em20udf2s9z8p8xc2zy',
    wallet3XOnlyPubkey: admin,
    roster,
    kascovMetadata: kascov,
    template: assetTemplate,
    ticketTemplate,
    controllerPreInitCtor: preInitExprs,
    next: [
      '1) Fund wallet 3 with TN10 KAS',
      '2) node scripts/broadcast-tkrex-migrate-controller-genesis.mjs --broadcast --key-file tkrex-migrate-deploy/wallet3.privkey',
      '3) node scripts/broadcast-tkrex-migrate-asset-genesis.mjs --broadcast --key-file tkrex-migrate-deploy/wallet3.privkey',
      '4) node scripts/broadcast-tkrex-migrate-handover.mjs --broadcast --key-file tkrex-migrate-deploy/wallet3.privkey',
      '5) Point Hub at new asset id; attestor issues tickets (KCC20_MIGRATE_AUTO_MINT unset)',
      '6) User Claim in Hub spends ticket + mints',
    ],
  };

  writeFileSync(join(outDir, 'SUMMARY.json'), JSON.stringify(summary, null, 2));
  writeFileSync(join(outDir, 'controller-preinit-artifact.json'), JSON.stringify(controllerArtifact, null, 2));

  console.log('Wrote', outDir);
  console.log(
    JSON.stringify(
      { tick: summary.tick, controllerKind: 'migrate-v3', threshold: ATTESTOR_THRESHOLD, kascov },
      null,
      2,
    ),
  );
}

main();
