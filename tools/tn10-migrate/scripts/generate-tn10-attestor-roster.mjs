/**
 * Generate (or load) three TN10 attestor keypairs for 2-of-3 soak.
 * Privkeys written to tkrex-migrate-deploy/.attestor{1,2,3}.privkey (gitignored).
 *
 *   node scripts/generate-tn10-attestor-roster.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ATTESTOR_THRESHOLD } from './lib/migrate-v3-ctor.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const openSilverRoot = resolve(__dirname, '..');
const hubRoot = resolve(
  process.env.TKREX_HUB_ROOT?.trim() || join(openSilverRoot, '../DAPPS/kasparex-connect-wallet'),
);
const outDir = join(openSilverRoot, 'tkrex-migrate-deploy');

const kaspaJs = pathToFileURL(join(hubRoot, 'public/kaspa-sdk/kaspa.js')).href;
const wasmBytes = readFileSync(join(hubRoot, 'public/kaspa-sdk/kaspa_bg.wasm'));
const kaspa = await import(kaspaJs);
await kaspa.default({ module_or_path: wasmBytes });
const { PrivateKey } = kaspa;

mkdirSync(outDir, { recursive: true });

async function loadOrCreate(id) {
  const privPath = join(outDir, `.attestor${id}.privkey`);
  let privHex = '';
  if (existsSync(privPath)) {
    privHex = readFileSync(privPath, 'utf8').trim().replace(/^0x/i, '').split(/\r?\n/)[0].trim();
  }
  if (!/^[0-9a-fA-F]{64}$/.test(privHex) && id === 1) {
    const w3 =
      (process.env.TKREX_WALLET3_PRIVKEY || '').trim().replace(/^0x/i, '') ||
      (existsSync(join(outDir, 'wallet3.privkey'))
        ? readFileSync(join(outDir, 'wallet3.privkey'), 'utf8').trim().split(/\r?\n/)[0].replace(/^0x/i, '')
        : '');
    if (/^[0-9a-fA-F]{64}$/.test(w3)) privHex = w3;
  }
  if (!/^[0-9a-fA-F]{64}$/.test(privHex)) {
    privHex = Buffer.from(randomBytes(32)).toString('hex');
    writeFileSync(privPath, `${privHex}\n`);
    console.log('Wrote', privPath);
  } else if (!existsSync(privPath)) {
    writeFileSync(privPath, `${privHex}\n`);
  }
  const key = new PrivateKey(privHex);
  let xOnly;
  try {
    xOnly = key.toKeypair().xOnlyPublicKey.toString();
  } catch {
    xOnly = key.toPublicKey().toString();
  }
  return { id, xOnlyPubkey: String(xOnly).replace(/^0x/i, '').slice(0, 64) };
}

const a1 = await loadOrCreate(1);
const a2 = await loadOrCreate(2);
const a3 = await loadOrCreate(3);

const roster = {
  network: 'testnet-10',
  threshold: ATTESTOR_THRESHOLD,
  adminXOnlyPubkey: a1.xOnlyPubkey,
  attestors: [
    { id: 1, xOnlyPubkey: a1.xOnlyPubkey, note: 'attestor1 (often wallet3)' },
    { id: 2, xOnlyPubkey: a2.xOnlyPubkey, note: 'attestor2' },
    { id: 3, xOnlyPubkey: a3.xOnlyPubkey, note: 'attestor3' },
  ],
  privkeyFiles: ['.attestor1.privkey', '.attestor2.privkey', '.attestor3.privkey'],
};

writeFileSync(join(outDir, 'ATTESTOR_ROSTER.json'), `${JSON.stringify(roster, null, 2)}\n`);
console.log(JSON.stringify(roster, null, 2));
