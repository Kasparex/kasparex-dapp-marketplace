/**
 * TN10 TKREX migrate asset-genesis + controller init (KCC20Migrate).
 *
 * Includes KCC-0021 kascov metadata JSON as the transaction payload.
 *
 * Dry-run:
 *   node scripts/broadcast-tkrex-migrate-asset-genesis.mjs
 *
 * Broadcast:
 *   node scripts/broadcast-tkrex-migrate-asset-genesis.mjs --broadcast --key-file tkrex-migrate-deploy/wallet3.privkey
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { encodeConstructorArgForSilverc } from '../sdk/dist/index.js';
import {
  TOTAL_CAP,
  ATTESTOR_THRESHOLD,
  loadAttestorRoster,
  migrateControllerExprs,
} from './lib/migrate-v3-ctor.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const openSilverRoot = resolve(__dirname, '..');
const hubRoot = resolve(openSilverRoot, '../DAPPS/kasparex-connect-wallet');
const outDir = join(openSilverRoot, 'tkrex-migrate-deploy');
const silvercBin = join(openSilverRoot, 'upstream/silverscript/target/debug/silverc.exe');

const WANT_BROADCAST = process.argv.includes('--broadcast');
const keyFileFlagIdx = process.argv.indexOf('--key-file');
const KEY_FILE =
  keyFileFlagIdx >= 0 ? resolve(process.cwd(), process.argv[keyFileFlagIdx + 1] || '') : '';

const ASSET_UTXO_SOMPI = BigInt(process.env.TKREX_ASSET_UTXO_SOMPI || '10000000');
const PRIORITY_FEE_SOMPI = BigInt(process.env.TKREX_PRIORITY_FEE_SOMPI || '2000000');
const COMPUTE_BUDGET = Number(process.env.TKREX_COMPUTE_BUDGET || '50');
const IDENTIFIER_COVENANT_ID = 0x02;
const WALLET3 =
  process.env.TKREX_WALLET3_ADDRESS ||
  'kaspatest:qqn2344wcpyrp3w4jx8dc6zd0mn2ml4glgn84ufwv7em20udf2s9z8p8xc2zy';

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

function hexToBytes(hex) {
  const body = String(hex).replace(/^0x/i, '');
  const out = new Uint8Array(body.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(body.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function compileWithExprs(contractRelPath, exprs, label) {
  const tempDir = mkdtempSync(join(tmpdir(), `tkrex-migrate-asset-${label}-`));
  const ctorPath = join(tempDir, 'ctor.json');
  const outPath = join(tempDir, 'artifact.json');
  writeFileSync(ctorPath, JSON.stringify(exprs), 'utf8');
  try {
    execFileSync(silvercBin, ['--constructor-args', ctorPath, join(openSilverRoot, contractRelPath), '--output', outPath], {
      stdio: 'pipe',
    });
    return JSON.parse(readFileSync(outPath, 'utf8'));
  } catch (err) {
    const stderr = err?.stderr?.toString?.() || err?.message || String(err);
    throw new Error(`silverc failed (${label}): ${stderr}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
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

function loadKascovPayloadBytes() {
  const meta = JSON.parse(readFileSync(join(outDir, 'TKREX_KASCOV_METADATA.json'), 'utf8'));
  const payloadObj = {
    name: meta.name || 'Test KREX',
    ticker: meta.ticker || 'TKREX',
    image: meta.image,
    image_hash: meta.image_hash,
  };
  const json = JSON.stringify(payloadObj);
  return { meta: payloadObj, bytes: new TextEncoder().encode(json), json };
}

const PRIV = loadPrivKeyHex();
const genesis = JSON.parse(readFileSync(join(outDir, 'CONTROLLER_GENESIS_RESULT.json'), 'utf8'));
const preInit = JSON.parse(readFileSync(join(outDir, 'controller-preinit-artifact.json'), 'utf8'));
const template = JSON.parse(readFileSync(join(outDir, 'template-parts.json'), 'utf8'));
const pubkey = readFileSync(join(openSilverRoot, 'TKREX_WALLET3_PUBKEY.txt'), 'utf8').trim();
const { meta: kascovMeta, bytes: payloadBytes, json: payloadJson } = loadKascovPayloadBytes();

const CONTROLLER_COV_ID = genesis.controllerCovenantId;
const CONTROLLER_TX = genesis.submittedTxId;
const CONTROLLER_P2SH = genesis.controllerP2shAddress;
const CONTROLLER_AMOUNT = BigInt(
  genesis.output0?.amountSompi || genesis.fundingSompi || genesis.expectedOutputSompi || '100000000',
);

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
  covenantId,
  payToScriptHashScript,
  addressFromScriptPublicKey,
  ScriptBuilder,
} = kaspa;

console.log('Compiling asset (KCC20 minter branch)...');
const assetExprs = [
  encodeConstructorArgForSilverc(CONTROLLER_COV_ID),
  { kind: 'int', data: 0 },
  { kind: 'byte', data: IDENTIFIER_COVENANT_ID },
  { kind: 'bool', data: true },
  { kind: 'int', data: 2 },
  { kind: 'int', data: 2 },
];
const assetArtifact = compileWithExprs('contracts/tokens/kcc20.sil', assetExprs, 'asset');
const assetScript = Uint8Array.from(assetArtifact.script);
const assetSpk = payToScriptHashScript(assetScript);
const assetAddress = addressFromScriptPublicKey(assetSpk, 'testnet-10').toString();
writeFileSync(join(outDir, 'asset-genesis-artifact.json'), JSON.stringify(assetArtifact, null, 2));

const controllerOutpoint = { transactionId: CONTROLLER_TX, index: 0 };
const assetOutputForId = {
  value: ASSET_UTXO_SOMPI,
  scriptPublicKey: assetSpk,
};
const assetCovHash = covenantId(controllerOutpoint, [{ index: 0, output: assetOutputForId }]);
const ASSET_COV_ID = assetCovHash.toString();
console.log('Asset covenant id:', ASSET_COV_ID);

console.log('Compiling initialized KCC20Migrate v3 controller...');
const roster = loadAttestorRoster(openSilverRoot, outDir);
const attestors = roster.attestors.map((a) => a.xOnlyPubkey);
const ticketTemplate = JSON.parse(readFileSync(join(outDir, 'ticket-template-parts.json'), 'utf8'));
const postInitExprs = migrateControllerExprs({
  adminPubkey: pubkey,
  attestors,
  threshold: ATTESTOR_THRESHOLD,
  totalCap: TOTAL_CAP,
  remainingAllowance: TOTAL_CAP,
  assetCovid: ASSET_COV_ID,
  initialized: true,
  adminRenounced: false,
  assetTemplate: template,
  ticketTemplate,
});
const postInitArtifact = compileWithExprs('contracts/tokens/kcc20-migrate.sil', postInitExprs, 'post-init');
const postInitScript = Uint8Array.from(postInitArtifact.script);
const postInitSpk = payToScriptHashScript(postInitScript);
const postInitAddress = addressFromScriptPublicKey(postInitSpk, 'testnet-10').toString();
writeFileSync(join(outDir, 'controller-postinit-artifact.json'), JSON.stringify(postInitArtifact, null, 2));

const controllerChange = CONTROLLER_AMOUNT - ASSET_UTXO_SOMPI - PRIORITY_FEE_SOMPI;
if (controllerChange <= 0n) {
  throw new Error(`Not enough KAS on controller UTXO for dust+fee. in=${CONTROLLER_AMOUNT}`);
}

const preInitScript = Uint8Array.from(preInit.script);
const preInitSpk = payToScriptHashScript(preInitScript);

const utxoRes = await fetch(
  `https://api-tn10.kaspa.org/addresses/${encodeURIComponent(CONTROLLER_P2SH)}/utxos`,
);
const utxoList = await utxoRes.json();
const live = (Array.isArray(utxoList) ? utxoList : []).find(
  (u) => u.outpoint?.transactionId === CONTROLLER_TX && Number(u.outpoint?.index) === 0,
);
if (!live) {
  throw new Error(`Controller UTXO ${CONTROLLER_TX}:0 not found on ${CONTROLLER_P2SH}`);
}
const blockDaaScore = BigInt(live.utxoEntry?.blockDaaScore || live.utxoEntry?.block_daa_score || 0);

const controllerEntry = {
  address: new Address(CONTROLLER_P2SH),
  outpoint: controllerOutpoint,
  amount: CONTROLLER_AMOUNT,
  scriptPublicKey: preInitSpk,
  blockDaaScore,
  isCoinbase: false,
  covenantId: CONTROLLER_COV_ID,
};

const unsigned = createTransaction(
  [controllerEntry],
  [
    { address: assetAddress, amount: ASSET_UTXO_SOMPI },
    { address: postInitAddress, amount: controllerChange },
  ],
  PRIORITY_FEE_SOMPI,
  payloadBytes,
);
unsigned.version = 1;
for (const tin of unsigned.inputs) {
  tin.sigOpCount = 0;
  tin.computeBudget = COMPUTE_BUDGET;
}

unsigned.populateGenesisCovenants([{ authorizingInput: 0, outputs: [0] }]);
unsigned.outputs[1].covenant = new CovenantBinding(0, new Hash(CONTROLLER_COV_ID));
unsigned.finalize();

const summary = {
  network: 'testnet-10',
  stage: 'migrate-asset-genesis-init',
  controllerKind: 'migrate',
  controllerTxId: CONTROLLER_TX,
  controllerCovenantId: CONTROLLER_COV_ID,
  assetCovenantId: ASSET_COV_ID,
  assetAddress,
  postInitAddress,
  assetUtxoSompi: ASSET_UTXO_SOMPI.toString(),
  controllerChangeSompi: controllerChange.toString(),
  priorityFeeSompi: PRIORITY_FEE_SOMPI.toString(),
  computeBudget: COMPUTE_BUDGET,
  kascovPayload: kascovMeta,
  kascovPayloadJson: payloadJson,
  unsignedTxId: unsigned.id?.toString?.() || String(unsigned.id),
  hubEnvHint: `NEXT_PUBLIC_KCC20_BRIDGE_COVENANTS={"TKREX":"${ASSET_COV_ID}"}`,
  broadcast: false,
};
writeFileSync(join(outDir, 'ASSET_GENESIS_PLAN.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

if (!WANT_BROADCAST) {
  console.log('\nDry-run only. Re-run with --broadcast and wallet 3 key to submit.');
  process.exit(0);
}

if (!/^[0-9a-fA-F]{64}$/.test(PRIV)) {
  console.error('Missing/invalid private key (64 hex).');
  process.exit(1);
}
const privKey = new PrivateKey(PRIV);
const derived = privKey.toAddress('testnet-10').toString();
if (derived !== WALLET3) {
  console.error(`Key derives ${derived}, expected ${WALLET3}`);
  process.exit(1);
}

console.log('Signing controller input...');
const rawSig = createInputSignature(unsigned, 0, privKey);
const adminSig = normalizeSchnorrSignature(rawSig);

// ABI for __covenant_entrypoint_auth_init:
// newState { kcc20Covid, totalCap, remainingAllowance, initialized, adminRenounced } + adminSig + selector
const prefixBuilder = new ScriptBuilder();
prefixBuilder.addData(hexToBytes(ASSET_COV_ID));
prefixBuilder.addI64(BigInt(TOTAL_CAP));
prefixBuilder.addI64(BigInt(TOTAL_CAP));
prefixBuilder.addI64(1n); // initialized
prefixBuilder.addI64(0n); // adminRenounced = false
prefixBuilder.addData(adminSig);
prefixBuilder.addI64(0n); // selector auth_init
const abiPrefixHex = prefixBuilder.drain();

const unlockHex = ScriptBuilder.fromScript(preInitScript, {
  flags: { covenantsEnabled: true },
}).encodePayToScriptHashSignatureScript(abiPrefixHex);
unsigned.inputs[0].signatureScript = unlockHex;
console.log('Unlock script bytes:', Math.ceil(String(unlockHex).length / 2));

const rpc = process.env.TKREX_RPC_URL
  ? new RpcClient({ url: process.env.TKREX_RPC_URL, encoding: Encoding.Borsh, networkId: 'testnet-10' })
  : new RpcClient({ resolver: new Resolver(), encoding: Encoding.Borsh, networkId: 'testnet-10' });

await rpc.connect();
try {
  const result = await rpc.submitTransaction({ transaction: unsigned, allowOrphan: false });
  const txid = String(result?.transactionId || result?.transaction_id || unsigned.id?.toString?.() || '');
  if (!txid) throw new Error('submitTransaction returned no txid');
  const done = {
    ...summary,
    broadcast: true,
    submittedTxId: txid,
    explorer: `https://tn10.kaspa.stream/transactions/${txid}`,
    kascovUrl: `https://kascov.io/testnet-10/c/${ASSET_COV_ID}`,
  };
  writeFileSync(join(outDir, 'ASSET_GENESIS_RESULT.json'), JSON.stringify(done, null, 2));
  console.log('\nBroadcast OK');
  console.log(JSON.stringify(done, null, 2));
  console.log('\nNext: set Hub env');
  console.log(done.hubEnvHint);
} finally {
  try {
    await rpc.disconnect();
  } catch {
    // ignore
  }
}
