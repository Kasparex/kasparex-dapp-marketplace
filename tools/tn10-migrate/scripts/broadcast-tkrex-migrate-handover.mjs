/**
 * TN10 KCC20Migrate handover: set adminRenounced=true (one-way).
 *
 * Dry-run:
 *   node scripts/broadcast-tkrex-migrate-handover.mjs
 *
 * Broadcast:
 *   node scripts/broadcast-tkrex-migrate-handover.mjs --broadcast --key-file tkrex-migrate-deploy/wallet3.privkey
 *
 * Reads live tip from MINT_TIP.json or ASSET_GENESIS_RESULT.json (controller UTXO).
 * Writes tip with adminRenounced=true and post-handover controller address.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  TOTAL_CAP,
  ATTESTOR_THRESHOLD,
  compileWithExprs,
  loadAttestorRoster,
  migrateControllerExprs,
  resolveSilvercBin,
} from './lib/migrate-v3-ctor.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const openSilverRoot = resolve(__dirname, '..');
const hubRoot = resolve(
  process.env.TKREX_HUB_ROOT?.trim() || join(openSilverRoot, '../DAPPS/kasparex-connect-wallet'),
);
const outDir = join(openSilverRoot, 'tkrex-migrate-deploy');
const silvercBin = resolveSilvercBin(openSilverRoot);

const WANT_BROADCAST = process.argv.includes('--broadcast');
const keyFileFlagIdx = process.argv.indexOf('--key-file');
const KEY_FILE =
  keyFileFlagIdx >= 0 ? resolve(process.cwd(), process.argv[keyFileFlagIdx + 1] || '') : '';

const PRIORITY_FEE_SOMPI = BigInt(process.env.TKREX_PRIORITY_FEE_SOMPI || '15000000');
const COMPUTE_BUDGET = Number(process.env.TKREX_COMPUTE_BUDGET || '200');
const HANDOVER_SELECTOR = 1n;

function loadPrivKeyHex() {
  const fromEnv = (process.env.TKREX_WALLET3_PRIVKEY || '').trim().replace(/^0x/i, '');
  if (fromEnv) return fromEnv;
  for (const p of [KEY_FILE, join(outDir, 'wallet3.privkey'), join(outDir, '.wallet3.privkey')].filter(Boolean)) {
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, 'utf8').trim().split(/\r?\n/)[0].trim().replace(/^0x/i, '').replace(/\s+/g, '');
    if (raw) return raw;
  }
  return '';
}

const PRIV = loadPrivKeyHex();
const genesis = JSON.parse(readFileSync(join(outDir, 'ASSET_GENESIS_RESULT.json'), 'utf8'));
const template = JSON.parse(readFileSync(join(outDir, 'template-parts.json'), 'utf8'));
const ticketTemplate = JSON.parse(readFileSync(join(outDir, 'ticket-template-parts.json'), 'utf8'));
const tipPath = join(outDir, 'MINT_TIP.json');
const tip = existsSync(tipPath) ? JSON.parse(readFileSync(tipPath, 'utf8')) : null;
const roster = loadAttestorRoster(openSilverRoot, outDir);
const attestors = roster.attestors.map((a) => a.xOnlyPubkey);
const adminPubkey = roster.adminXOnlyPubkey;

const ASSET_COV_ID = tip?.assetCovenantId || genesis.assetCovenantId;
const CONTROLLER_COV_ID = tip?.controllerCovenantId || genesis.controllerCovenantId;
const remaining = BigInt(tip?.remainingAllowance || TOTAL_CAP);
const liveControllerAddress = tip?.controllerAddress || genesis.postInitAddress;
const liveControllerTxId = tip?.controllerTxId || genesis.submittedTxId;
const liveControllerIndex = Number(tip?.controllerIndex ?? 1);

const kaspaJs = pathToFileURL(join(hubRoot, 'public/kaspa-sdk/kaspa.js')).href;
const wasmBytes = readFileSync(join(hubRoot, 'public/kaspa-sdk/kaspa_bg.wasm'));
const kaspa = await import(kaspaJs);
await kaspa.default({ module_or_path: wasmBytes });
kaspa.initConsolePanicHook?.();

const {
  Address,
  PrivateKey,
  CovenantBinding,
  Hash,
  RpcClient,
  Resolver,
  Encoding,
  createTransaction,
  createInputSignature,
  payToScriptHashScript,
  addressFromScriptPublicKey,
  ScriptBuilder,
} = kaspa;

console.log('Compiling pre-handover controller...');
const spendExprs = migrateControllerExprs({
  adminPubkey,
  attestors,
  threshold: ATTESTOR_THRESHOLD,
  totalCap: TOTAL_CAP,
  remainingAllowance: Number(remaining),
  assetCovid: ASSET_COV_ID,
  initialized: true,
  adminRenounced: false,
  assetTemplate: template,
  ticketTemplate,
});
const spendArtifact = compileWithExprs(
  openSilverRoot,
  silvercBin,
  'contracts/tokens/kcc20-migrate.sil',
  spendExprs,
  'pre-handover',
);
const spendScript = Uint8Array.from(spendArtifact.script);

console.log('Compiling post-handover controller...');
const postExprs = migrateControllerExprs({
  adminPubkey,
  attestors,
  threshold: ATTESTOR_THRESHOLD,
  totalCap: TOTAL_CAP,
  remainingAllowance: Number(remaining),
  assetCovid: ASSET_COV_ID,
  initialized: true,
  adminRenounced: true,
  assetTemplate: template,
  ticketTemplate,
});
const postArtifact = compileWithExprs(
  openSilverRoot,
  silvercBin,
  'contracts/tokens/kcc20-migrate.sil',
  postExprs,
  'post-handover',
);
const postScript = Uint8Array.from(postArtifact.script);
const postSpk = payToScriptHashScript(postScript);
const postAddress = addressFromScriptPublicKey(postSpk, 'testnet-10').toString();
writeFileSync(join(outDir, 'controller-post-handover-artifact.json'), JSON.stringify(postArtifact, null, 2));

const utxoRes = await fetch(
  `https://api-tn10.kaspa.org/addresses/${encodeURIComponent(liveControllerAddress)}/utxos`,
);
const utxoList = await utxoRes.json();
const live = (Array.isArray(utxoList) ? utxoList : []).find(
  (u) =>
    u.outpoint?.transactionId === liveControllerTxId &&
    Number(u.outpoint?.index) === liveControllerIndex,
);
if (!live) {
  throw new Error(`Controller UTXO ${liveControllerTxId}:${liveControllerIndex} not found on ${liveControllerAddress}`);
}
const controllerAmount = BigInt(live.utxoEntry?.amount || live.utxoEntry?.Amount || 0);
const blockDaaScore = BigInt(live.utxoEntry?.blockDaaScore || live.utxoEntry?.block_daa_score || 0);
const keep = controllerAmount - PRIORITY_FEE_SOMPI;
if (keep <= 0n) throw new Error('Controller UTXO too small for handover fee');

const spendSpk = payToScriptHashScript(spendScript);
const controllerEntry = {
  address: new Address(liveControllerAddress),
  outpoint: { transactionId: liveControllerTxId, index: liveControllerIndex },
  amount: controllerAmount,
  scriptPublicKey: spendSpk,
  blockDaaScore,
  isCoinbase: false,
  covenantId: CONTROLLER_COV_ID,
};

const unsigned = createTransaction(
  [controllerEntry],
  [{ address: postAddress, amount: keep }],
  PRIORITY_FEE_SOMPI,
);
unsigned.version = 1;
for (const tin of unsigned.inputs) {
  tin.sigOpCount = 0;
  tin.computeBudget = COMPUTE_BUDGET;
}
unsigned.outputs[0].covenant = new CovenantBinding(0, new Hash(CONTROLLER_COV_ID));

const result = {
  network: 'testnet-10',
  migrateVersion: 3,
  adminRenounced: true,
  controllerAddress: postAddress,
  controllerTxId: null,
  controllerIndex: 0,
  controllerCovenantId: CONTROLLER_COV_ID,
  assetCovenantId: ASSET_COV_ID,
  remainingAllowance: String(remaining),
  minterTxId: tip?.minterTxId || genesis.submittedTxId,
  minterIndex: Number(tip?.minterIndex ?? 0),
  minterAddress: tip?.minterAddress || genesis.assetAddress,
};

if (!WANT_BROADCAST) {
  writeFileSync(join(outDir, 'HANDOVER_DRY_RUN.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log('Dry-run OK. Post-handover controller address:', postAddress);
  console.log('Re-run with --broadcast to submit.');
  process.exit(0);
}

if (!/^[0-9a-fA-F]{64}$/.test(PRIV)) {
  throw new Error('Missing wallet3 private key for handover broadcast');
}

function hexToBytes(hex) {
  const body = String(hex).replace(/^0x/i, '');
  const out = new Uint8Array(body.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(body.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function normalizeSchnorrSignature(raw) {
  let signature = typeof raw === 'string' ? hexToBytes(raw) : raw;
  if (signature.length === 66 && signature[0] === 65) signature = signature.slice(1);
  if (signature.length === 64) {
    const withType = new Uint8Array(65);
    withType.set(signature);
    withType[64] = 0x01;
    return withType;
  }
  if (signature.length !== 65) {
    throw new Error(`Expected 65-byte schnorr+sighash; got ${signature.length}`);
  }
  return signature;
}

const key = new PrivateKey(PRIV);
const entries = [controllerEntry];
const adminSig = normalizeSchnorrSignature(createInputSignature(unsigned, 0, key, entries));

// newState { covid, totalCap, remaining, initialized=true, adminRenounced=true } + adminSig + selector
const prefix = new ScriptBuilder();
prefix.addData(Buffer.from(ASSET_COV_ID, 'hex'));
prefix.addI64(BigInt(TOTAL_CAP));
prefix.addI64(remaining);
prefix.addI64(1n); // initialized
prefix.addI64(1n); // adminRenounced
prefix.addData(adminSig);
prefix.addI64(HANDOVER_SELECTOR);
const prefixHex = prefix.drain();

unsigned.inputs[0].signatureScript = ScriptBuilder.fromScript(spendScript, {
  flags: { covenantsEnabled: true },
}).encodePayToScriptHashSignatureScript(prefixHex);

const rpc = new RpcClient({
  resolver: new Resolver(),
  networkId: 'testnet-10',
  encoding: Encoding.Borsh,
});
await rpc.connect();
try {
  const { transactionId } = await rpc.submitTransaction({ transaction: unsigned, allowOrphan: false });
  result.controllerTxId = transactionId;
  result.controllerIndex = 0;
  result.updatedAt = new Date().toISOString();
  result.assetTemplate = template;
  result.ticketTemplate = ticketTemplate;
  if (existsSync(join(outDir, 'controller-template-parts.json'))) {
    result.controllerTemplate = JSON.parse(
      readFileSync(join(outDir, 'controller-template-parts.json'), 'utf8'),
    );
  }
  writeFileSync(join(outDir, 'HANDOVER_RESULT.json'), `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync(tipPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log('Handover submitted:', transactionId);
  console.log('Admin mint power renounced. Tip updated.');
} finally {
  await rpc.disconnect();
}
