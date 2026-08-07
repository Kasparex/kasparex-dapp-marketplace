/**
 * TN10 TKREX KCC20Migrate mint (1:1 against a keyless sink burn).
 *
 * Same UTXO shape as capped mint (continued minter + recipient + singleton
 * controller), but unlocks `mint` with burnTxId + adminRenounced state.
 *
 * Dry-run:
 *   TKREX_MINT_AMOUNT_RAW=600000000 TKREX_BURN_TXID=<64hex> node scripts/broadcast-tkrex-migrate-mint.mjs
 *
 * Broadcast:
 *   1) Put 64 hex chars alone in tkrex-migrate-deploy/wallet3.privkey
 *   2) … --broadcast --key-file tkrex-migrate-deploy/wallet3.privkey
 *   3) Delete the key file
 *
 * Env:
 *   TKREX_MINT_AMOUNT_RAW   required (raw units @ 8 decimals)
 *   TKREX_BURN_TXID         required 64-hex Kasplex burn (also accepts TKREX_DEPOSIT_TXID)
 *   TKREX_RECIPIENT_PUBKEY  x-only 64-hex (default: resolve from TKREX_RECIPIENT_ADDRESS or wallet3)
 *   TKREX_RECIPIENT_ADDRESS kaspa address to mint to (decoded via XOnlyPublicKey.fromAddress)
 *   TKREX_HUB_ROOT          Hub checkout (default ../DAPPS/kasparex-connect-wallet)
 *   KREX_WRAP_HUB_URL       when set, pull/push mint tip via ?mode=mint-tip
 *   KCC20_BRIDGE_WATCHER_SECRET  required to POST tip
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
  resolveSilvercBin,
} from './lib/migrate-v3-ctor.mjs';
import {
  encodeMigrateTicketState,
  spliceTemplateScript,
} from './lib/migrate-state-encode.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const openSilverRoot = resolve(__dirname, '..');
const hubRoot = resolve(
  process.env.TKREX_HUB_ROOT?.trim() || join(openSilverRoot, '../DAPPS/kasparex-connect-wallet'),
);
const outDir = join(openSilverRoot, 'tkrex-migrate-deploy');

const silvercBin = resolveSilvercBin(openSilverRoot);

const HUB_URL = (process.env.KREX_WRAP_HUB_URL || '').replace(/\/$/, '');
const HUB_SECRET =
  process.env.KCC20_MIGRATE_ATTESTOR_SECRET?.trim() ||
  process.env.KCC20_BRIDGE_WATCHER_SECRET?.trim() ||
  '';

const WANT_BROADCAST = process.argv.includes('--broadcast');
const keyFileFlagIdx = process.argv.indexOf('--key-file');
const KEY_FILE =
  keyFileFlagIdx >= 0 ? resolve(process.cwd(), process.argv[keyFileFlagIdx + 1] || '') : '';

if (!process.env.TKREX_MINT_AMOUNT_RAW) {
  throw new Error('Set TKREX_MINT_AMOUNT_RAW (raw units, 8 decimals). Example: 600000000 for 6 TKREX.');
}
const MINT_AMOUNT = BigInt(process.env.TKREX_MINT_AMOUNT_RAW);
const BURN_TXID = (
  process.env.TKREX_BURN_TXID ||
  process.env.TKREX_DEPOSIT_TXID ||
  ''
)
  .trim()
  .toLowerCase()
  .replace(/^0x/i, '');
if (!/^[a-f0-9]{64}$/.test(BURN_TXID)) {
  throw new Error('Set TKREX_BURN_TXID (64 hex) for KCC20Migrate mint binding.');
}

const PRIORITY_FEE_SOMPI = BigInt(process.env.TKREX_PRIORITY_FEE_SOMPI || '15000000');
const COMPUTE_BUDGET = Number(process.env.TKREX_COMPUTE_BUDGET || '200');
const BRANCH_UTXO_SOMPI = BigInt(process.env.TKREX_BRANCH_UTXO_SOMPI || '50000000');
const EXTRA_FUNDING_SOMPI = BigInt(process.env.TKREX_MINT_EXTRA_FUNDING_SOMPI || '200000000');
const CONTROLLER_KEEP_SOMPI = BigInt(process.env.TKREX_CONTROLLER_KEEP_SOMPI || '200000000');
const IDENTIFIER_PUBKEY = 0x00;
const IDENTIFIER_COVENANT_ID = 0x02;
// Covenant singleton selectors: init=0, handover=1, mint=2
const MINT_SELECTOR = 2n;
const WALLET3 =
  process.env.TKREX_WALLET3_ADDRESS ||
  'kaspatest:qqn2344wcpyrp3w4jx8dc6zd0mn2ml4glgn84ufwv7em20udf2s9z8p8xc2zy';

function loadPrivKeyHex() {
  const fromEnv = (process.env.TKREX_WALLET3_PRIVKEY || '').trim().replace(/^0x/i, '');
  if (fromEnv) return fromEnv;
  for (const p of [
    KEY_FILE,
    join(outDir, 'wallet3.privkey'),
    join(outDir, '.wallet3.privkey'),
    join(openSilverRoot, 'tkrex-deploy/wallet3.privkey'),
    join(openSilverRoot, 'tkrex-deploy/wallet3.privkey.json'),
  ].filter(Boolean)) {
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

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function i64le(n) {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(n));
  return buf;
}

function concatBytes(...parts) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function compileWithExprs(contractRelPath, exprs, label) {
  const tempDir = mkdtempSync(join(tmpdir(), `tkrex-migrate-mint-${label}-`));
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

async function fetchUtxo(address, txId, index) {
  const res = await fetch(`https://api-tn10.kaspa.org/addresses/${encodeURIComponent(address)}/utxos`);
  if (!res.ok) throw new Error(`UTXO fetch failed for ${address}: ${res.status}`);
  const list = await res.json();
  const live = (Array.isArray(list) ? list : []).find(
    (u) => u.outpoint?.transactionId === txId && Number(u.outpoint?.index) === index,
  );
  if (!live) throw new Error(`UTXO ${txId}:${index} not found on ${address}`);
  return live;
}

async function resolveRecipientPubkey(kaspa, adminPubkey) {
  const fromEnv = (process.env.TKREX_RECIPIENT_PUBKEY || '').trim().replace(/^0x/i, '').toLowerCase();
  if (/^[0-9a-f]{64}$/.test(fromEnv)) return fromEnv;
  const addr = (process.env.TKREX_RECIPIENT_ADDRESS || '').trim();
  if (addr) {
    const x = kaspa.XOnlyPublicKey.fromAddress(new kaspa.Address(addr));
    return String(x).replace(/^0x/i, '').toLowerCase();
  }
  return adminPubkey.toLowerCase();
}

async function fetchHubMintTip() {
  if (!HUB_URL) return null;
  try {
    const res = await fetch(`${HUB_URL}/api/krex-wrap/mint-receipts?mode=mint-tip`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.tip && typeof json.tip === 'object' ? json.tip : null;
  } catch {
    return null;
  }
}

async function postHubMintTip(tip) {
  if (!HUB_URL || !HUB_SECRET) {
    console.warn('Skip Hub mint-tip POST (need KREX_WRAP_HUB_URL + watcher secret)');
    return { ok: false, skipped: true };
  }
  const res = await fetch(`${HUB_URL}/api/krex-wrap/mint-receipts?mode=mint-tip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${HUB_SECRET}`,
    },
    body: JSON.stringify(tip),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

const PRIV = loadPrivKeyHex();
const genesis = JSON.parse(readFileSync(join(outDir, 'ASSET_GENESIS_RESULT.json'), 'utf8'));
const template = JSON.parse(readFileSync(join(outDir, 'template-parts.json'), 'utf8'));
const tipPath = join(outDir, 'MINT_TIP.json');
let tip = existsSync(tipPath) ? JSON.parse(readFileSync(tipPath, 'utf8')) : null;
if (!tip) {
  const remoteTip = await fetchHubMintTip();
  if (remoteTip) {
    tip = remoteTip;
    writeFileSync(tipPath, `${JSON.stringify(tip, null, 2)}\n`);
    console.log('Loaded mint tip from Hub');
  }
}
const adminPubkey = readFileSync(join(openSilverRoot, 'TKREX_WALLET3_PUBKEY.txt'), 'utf8')
  .trim()
  .replace(/^0x/i, '');

/** Live tip is still pre-ticket soak (83b999) until fresh v3 deploy + handover. */
const tipMigrateVersion = Number(tip?.migrateVersion ?? 2);
const LEGACY_MINT =
  process.env.TKREX_MIGRATE_LEGACY === '1' ||
  tipMigrateVersion < 3 ||
  tip?.legacyNote ||
  String(tip?.assetCovenantId || '').toLowerCase() ===
    '83b999756e613d2749b8ff9549de4bdd0cb864f3d5d2dc606d92f3aa740ee91a';

let attestors = [adminPubkey, adminPubkey, adminPubkey];
let ticketTemplate = null;
let adminRenounced = false;
let TICKET_TXID = '';
let TICKET_INDEX = 0;

if (!LEGACY_MINT) {
  const roster = loadAttestorRoster(openSilverRoot, outDir);
  attestors = roster.attestors.map((a) => a.xOnlyPubkey);
  ticketTemplate = JSON.parse(readFileSync(join(outDir, 'ticket-template-parts.json'), 'utf8'));
  adminRenounced = tip?.adminRenounced === true || process.env.TKREX_ADMIN_RENOUNCED === '1';
  TICKET_TXID = (process.env.TKREX_TICKET_TXID || '').trim().toLowerCase().replace(/^0x/i, '');
  TICKET_INDEX = Number(process.env.TKREX_TICKET_INDEX ?? '0');
  if (!/^[a-f0-9]{64}$/.test(TICKET_TXID)) {
    throw new Error('Set TKREX_TICKET_TXID (active MigrateTicket outpoint) for v3 mint.');
  }
} else {
  console.log('Legacy mint path (pre-ticket soak tip). No MigrateTicket required.');
  adminRenounced = false;
}

const CONTROLLER_COV_ID = genesis.controllerCovenantId;
const ASSET_COV_ID = genesis.assetCovenantId;
const remainingBefore = tip ? BigInt(tip.remainingAllowance) : BigInt(TOTAL_CAP);
const remainingAfter = remainingBefore - MINT_AMOUNT;
if (remainingAfter < 0n) throw new Error(`Mint exceeds remaining allowance (${remainingBefore})`);

const liveMinterAddress = tip?.minterAddress || genesis.assetAddress;
const liveMinterTxId = tip?.minterTxId || genesis.submittedTxId;
const liveMinterIndex = Number(tip?.minterIndex ?? 0);
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
  ScriptPublicKey,
} = kaspa;

const pubkey = await resolveRecipientPubkey(kaspa, adminPubkey);

console.log('Compiling continued minter branch...');
const minterExprs = [
  encodeConstructorArgForSilverc(CONTROLLER_COV_ID),
  { kind: 'int', data: 0 },
  { kind: 'byte', data: IDENTIFIER_COVENANT_ID },
  { kind: 'bool', data: true },
  { kind: 'int', data: 2 },
  { kind: 'int', data: 2 },
];
const minterArtifact = compileWithExprs('contracts/tokens/kcc20.sil', minterExprs, 'minter');
const minterScript = Uint8Array.from(minterArtifact.script);
const minterSpk = payToScriptHashScript(minterScript);
const minterAddress = addressFromScriptPublicKey(minterSpk, 'testnet-10').toString();
writeFileSync(join(outDir, 'mint-minter-artifact.json'), JSON.stringify(minterArtifact, null, 2));

console.log('Compiling recipient branch...');
const recipientExprs = [
  encodeConstructorArgForSilverc(pubkey),
  { kind: 'int', data: Number(MINT_AMOUNT) },
  { kind: 'byte', data: IDENTIFIER_PUBKEY },
  { kind: 'bool', data: false },
  { kind: 'int', data: 2 },
  { kind: 'int', data: 2 },
];
const recipientArtifact = compileWithExprs('contracts/tokens/kcc20.sil', recipientExprs, 'recipient');
const recipientScript = Uint8Array.from(recipientArtifact.script);
const recipientSpk = payToScriptHashScript(recipientScript);
const recipientAddress = addressFromScriptPublicKey(recipientSpk, 'testnet-10').toString();
writeFileSync(join(outDir, 'mint-recipient-artifact.json'), JSON.stringify(recipientArtifact, null, 2));

console.log('Compiling spend-side migrate controller v3 (current remaining)...');
const spendControllerExprs = migrateControllerExprs({
  adminPubkey,
  attestors,
  threshold: ATTESTOR_THRESHOLD,
  totalCap: TOTAL_CAP,
  remainingAllowance: Number(remainingBefore),
  assetCovid: ASSET_COV_ID,
  initialized: true,
  adminRenounced,
  assetTemplate: template,
  ticketTemplate,
});
const spendControllerArtifact = compileWithExprs('contracts/tokens/kcc20-migrate.sil', spendControllerExprs, 'spend-controller');
const spendControllerScript = Uint8Array.from(spendControllerArtifact.script);

console.log('Compiling post-mint migrate controller...');
const postMintExprs = migrateControllerExprs({
  adminPubkey,
  attestors,
  threshold: ATTESTOR_THRESHOLD,
  totalCap: TOTAL_CAP,
  remainingAllowance: Number(remainingAfter),
  assetCovid: ASSET_COV_ID,
  initialized: true,
  adminRenounced,
  assetTemplate: template,
  ticketTemplate,
});
const postMintArtifact = compileWithExprs('contracts/tokens/kcc20-migrate.sil', postMintExprs, 'post-mint');
const postMintScript = Uint8Array.from(postMintArtifact.script);
const postMintSpk = payToScriptHashScript(postMintScript);
const postMintAddress = addressFromScriptPublicKey(postMintSpk, 'testnet-10').toString();
writeFileSync(join(outDir, 'controller-postmint-artifact.json'), JSON.stringify(postMintArtifact, null, 2));

const assetLive = await fetchUtxo(liveMinterAddress, liveMinterTxId, liveMinterIndex);
const controllerLive = await fetchUtxo(liveControllerAddress, liveControllerTxId, liveControllerIndex);
const assetAmount = BigInt(assetLive.utxoEntry?.amount || assetLive.utxoEntry?.Amount || 0);
const controllerAmount = BigInt(controllerLive.utxoEntry?.amount || controllerLive.utxoEntry?.Amount || 0);
const assetDaa = BigInt(assetLive.utxoEntry?.blockDaaScore || assetLive.utxoEntry?.block_daa_score || 0);
const controllerDaa = BigInt(controllerLive.utxoEntry?.blockDaaScore || controllerLive.utxoEntry?.block_daa_score || 0);

let ticketLive = null;
let ticketAmount = 0n;
let ticketDaa = 0n;
let ticketAddress = '';
let ticketSpendScript = null;
const TICKET_INPUT_IDX = LEGACY_MINT ? -1 : Number(process.env.TKREX_TICKET_INPUT_IDX || '2');
if (!LEGACY_MINT) {
  // Rebuild active ticket redeem script from template + known issued state.
  const activeTicketState = encodeMigrateTicketState({
    threshold: ATTESTOR_THRESHOLD,
    burnTxId: BURN_TXID,
    amountRaw: MINT_AMOUNT,
    claimantXOnly: pubkey,
    active: true,
  });
  ticketSpendScript = spliceTemplateScript(ticketTemplate, activeTicketState);
  const ticketSpkProbe = payToScriptHashScript(Uint8Array.from(ticketSpendScript));
  ticketAddress = addressFromScriptPublicKey(ticketSpkProbe, 'testnet-10').toString();
  ticketLive = await fetchUtxo(ticketAddress, TICKET_TXID, TICKET_INDEX);
  ticketAmount = BigInt(ticketLive.utxoEntry?.amount || ticketLive.utxoEntry?.Amount || 0);
  ticketDaa = BigInt(ticketLive.utxoEntry?.blockDaaScore || ticketLive.utxoEntry?.block_daa_score || 0);
}

const fundRes = await fetch(`https://api-tn10.kaspa.org/addresses/${encodeURIComponent(WALLET3)}/utxos`);
if (!fundRes.ok) throw new Error(`Wallet3 UTXO fetch failed: ${fundRes.status}`);
const fundRaw = await fundRes.json();
const fundList = Array.isArray(fundRaw) ? fundRaw : fundRaw.utxos || fundRaw.result || [];
const fundUtxo = fundList
  .map((u) => {
    const entry = u.utxoEntry || u.entry || u;
    const outpoint = u.outpoint || u.previousOutpoint || {};
    const amount = BigInt(entry.amount ?? u.amount ?? 0);
    const spkRaw =
      entry.scriptPublicKey?.scriptPublicKey ||
      entry.scriptPublicKey?.script ||
      entry.scriptPublicKey ||
      u.scriptPublicKey ||
      '';
    const scriptHex =
      typeof spkRaw === 'string' ? spkRaw.replace(/^0x/i, '') : Buffer.from(spkRaw).toString('hex');
    return {
      outpoint: {
        transactionId: outpoint.transactionId || outpoint.transaction_id,
        index: Number(outpoint.index ?? outpoint.outpointIndex ?? 0),
      },
      amount,
      scriptHex,
      blockDaaScore: BigInt(entry.blockDaaScore ?? entry.block_daa_score ?? 0),
      isCoinbase: Boolean(entry.isCoinbase ?? entry.is_coinbase ?? false),
    };
  })
  .filter((x) => x.amount >= EXTRA_FUNDING_SOMPI)
  .filter((x) => !String(x.scriptHex || '').startsWith('aa20'))
  .sort((a, b) => (a.amount < b.amount ? -1 : 1))[0];
if (!fundUtxo) {
  throw new Error(`Need a wallet3 UTXO >= ${EXTRA_FUNDING_SOMPI} sompi for mint storage mass`);
}
const fundAmount = fundUtxo.amount;
const fundDaa = fundUtxo.blockDaaScore;
const fundOutpoint = fundUtxo.outpoint;

const totalIn = assetAmount + controllerAmount + ticketAmount + fundAmount;
const changeSompi =
  totalIn - BRANCH_UTXO_SOMPI - BRANCH_UTXO_SOMPI - CONTROLLER_KEEP_SOMPI - PRIORITY_FEE_SOMPI;
if (changeSompi < 0n) {
  throw new Error(
    `Not enough KAS for mint outputs+fee. in=${totalIn} keep=${CONTROLLER_KEEP_SOMPI} fee=${PRIORITY_FEE_SOMPI}`,
  );
}
const controllerOut = CONTROLLER_KEEP_SOMPI;

const assetSpendScript = tip
  ? minterScript
  : Uint8Array.from(JSON.parse(readFileSync(join(outDir, 'asset-genesis-artifact.json'), 'utf8')).script);

const assetEntry = {
  address: new Address(liveMinterAddress),
  outpoint: { transactionId: liveMinterTxId, index: liveMinterIndex },
  amount: assetAmount,
  scriptPublicKey: payToScriptHashScript(assetSpendScript),
  blockDaaScore: assetDaa,
  isCoinbase: false,
  covenantId: ASSET_COV_ID,
};
const controllerEntry = {
  address: new Address(liveControllerAddress),
  outpoint: { transactionId: liveControllerTxId, index: liveControllerIndex },
  amount: controllerAmount,
  scriptPublicKey: payToScriptHashScript(spendControllerScript),
  blockDaaScore: controllerDaa,
  isCoinbase: false,
  covenantId: CONTROLLER_COV_ID,
};
const fundingEntry = {
  address: new Address(WALLET3),
  outpoint: fundOutpoint,
  amount: fundAmount,
  scriptPublicKey: new ScriptPublicKey(0, fundUtxo.scriptHex),
  blockDaaScore: fundDaa,
  isCoinbase: fundUtxo.isCoinbase,
};

const ticketEntry =
  !LEGACY_MINT && ticketLive
    ? {
        address: new Address(ticketAddress),
        outpoint: { transactionId: TICKET_TXID, index: TICKET_INDEX },
        amount: ticketAmount,
        scriptPublicKey: payToScriptHashScript(Uint8Array.from(ticketSpendScript)),
        blockDaaScore: ticketDaa,
        isCoinbase: false,
      }
    : null;

const inputEntries = ticketEntry
  ? [assetEntry, controllerEntry, ticketEntry, fundingEntry]
  : [assetEntry, controllerEntry, fundingEntry];
const fundingInputIdx = ticketEntry ? 3 : 2;

const unsigned = createTransaction(
  inputEntries,
  [
    { address: minterAddress, amount: BRANCH_UTXO_SOMPI },
    { address: recipientAddress, amount: BRANCH_UTXO_SOMPI },
    { address: postMintAddress, amount: controllerOut },
    ...(changeSompi > 0n ? [{ address: WALLET3, amount: changeSompi }] : []),
  ],
  PRIORITY_FEE_SOMPI,
);
unsigned.version = 1;
for (const tin of unsigned.inputs) {
  tin.sigOpCount = 0;
  tin.computeBudget = COMPUTE_BUDGET;
}

unsigned.outputs[0].covenant = new CovenantBinding(0, new Hash(ASSET_COV_ID));
unsigned.outputs[1].covenant = new CovenantBinding(0, new Hash(ASSET_COV_ID));
unsigned.outputs[2].covenant = new CovenantBinding(1, new Hash(CONTROLLER_COV_ID));
unsigned.finalize();

const summary = {
  network: 'testnet-10',
  stage: 'kcc20-migrate-mint',
  burnTxId: BURN_TXID,
  mintAmountRaw: MINT_AMOUNT.toString(),
  mintAmountHuman: Number(MINT_AMOUNT) / 1e8,
  recipientPubkey: pubkey,
  remainingAllowanceBefore: remainingBefore.toString(),
  remainingAllowanceAfter: remainingAfter.toString(),
  assetCovenantId: ASSET_COV_ID,
  controllerCovenantId: CONTROLLER_COV_ID,
  tipTxId: liveMinterTxId,
  chainedFromTip: Boolean(tip),
  minterAddress,
  recipientAddress,
  postMintAddress,
  assetInSompi: assetAmount.toString(),
  controllerInSompi: controllerAmount.toString(),
  fundingInSompi: fundAmount.toString(),
  fundingOutpoint: fundOutpoint,
  branchUtxoSompi: BRANCH_UTXO_SOMPI.toString(),
  controllerOutSompi: controllerOut.toString(),
  changeSompi: changeSompi.toString(),
  priorityFeeSompi: PRIORITY_FEE_SOMPI.toString(),
  computeBudget: COMPUTE_BUDGET,
  unsignedTxId: unsigned.id?.toString?.() || String(unsigned.id),
  broadcast: false,
};
writeFileSync(join(outDir, 'MINT_PLAN.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

if (!WANT_BROADCAST) {
  console.log('\nDry-run only. Re-run with --broadcast and wallet 3 key to submit.');
  process.exit(0);
}

if (!/^[0-9a-fA-F]{64}$/.test(PRIV)) {
  console.error('Missing/invalid private key (64 hex). Use tkrex-migrate-deploy/wallet3.privkey or TKREX_WALLET3_PRIVKEY.');
  process.exit(1);
}
const privKey = new PrivateKey(PRIV);
const derived = privKey.toAddress('testnet-10').toString();
if (derived !== WALLET3) {
  console.error(`Key derives ${derived}, expected ${WALLET3}`);
  process.exit(1);
}

console.log(
  `Signing controller input (index 1) and funding input (index ${fundingInputIdx})...`,
);
const rawSig = createInputSignature(unsigned, 1, privKey);
const authoritySig = adminRenounced
  ? (() => {
      const d = new Uint8Array(65);
      d[64] = 0x01;
      return d;
    })()
  : normalizeSchnorrSignature(rawSig);
const authoritySigHex = bytesToHex(authoritySig);

const fundSigHex = createInputSignature(unsigned, fundingInputIdx, privKey);
unsigned.inputs[fundingInputIdx].signatureScript = fundSigHex;

if (ticketEntry) {
  // Terminal redeem: claimantPk + claimantSig (entrypoint; no selector).
  const claimPrivHex =
    (process.env.TKREX_CLAIMANT_PRIVKEY || '').trim().replace(/^0x/i, '') || PRIV;
  const claimKey = new PrivateKey(claimPrivHex);
  const claimRaw = createInputSignature(unsigned, TICKET_INPUT_IDX, claimKey, inputEntries);
  const claimSig = normalizeSchnorrSignature(claimRaw);
  const ticketPrefix = new ScriptBuilder();
  ticketPrefix.addData(hexToBytes(pubkey));
  ticketPrefix.addData(claimSig);
  const ticketPrefixHex = ticketPrefix.drain();
  unsigned.inputs[TICKET_INPUT_IDX].signatureScript = ScriptBuilder.fromScript(
    Uint8Array.from(ticketSpendScript),
    { flags: { covenantsEnabled: true } },
  ).encodePayToScriptHashSignatureScript(ticketPrefixHex);
}

// Asset leader transfer unlock (input 0)
const assetPrefix = new ScriptBuilder();
assetPrefix.addData(concatBytes(hexToBytes(CONTROLLER_COV_ID), hexToBytes(pubkey)));
assetPrefix.addData(Uint8Array.from([IDENTIFIER_COVENANT_ID, IDENTIFIER_PUBKEY]));
assetPrefix.addData(concatBytes(i64le(0), i64le(MINT_AMOUNT)));
assetPrefix.addData(Uint8Array.from([1, 0]));
assetPrefix.addData(new Uint8Array(0));
assetPrefix.addData(Uint8Array.from([1]));
assetPrefix.addI64(0n);
const assetPrefixHex = assetPrefix.drain();

// Migrate controller mint unlock (input 1):
// newState { covid, totalCap, remaining, initialized, adminRenounced } + authoritySig + burnTxId + states + selector
const ctrlPrefix = new ScriptBuilder();
ctrlPrefix.addData(hexToBytes(ASSET_COV_ID));
ctrlPrefix.addI64(BigInt(TOTAL_CAP));
ctrlPrefix.addI64(remainingAfter);
ctrlPrefix.addI64(1n); // initialized
ctrlPrefix.addI64(adminRenounced ? 1n : 0n); // adminRenounced
ctrlPrefix.addData(authoritySig);
ctrlPrefix.addData(hexToBytes(BURN_TXID));
ctrlPrefix.addI64(BigInt(TICKET_INPUT_IDX >= 0 ? TICKET_INPUT_IDX : 2)); // ticketInputIdx in claim tx
// minter KCC20State
ctrlPrefix.addData(hexToBytes(CONTROLLER_COV_ID));
ctrlPrefix.addData(Uint8Array.from([IDENTIFIER_COVENANT_ID]));
ctrlPrefix.addI64(0n);
ctrlPrefix.addI64(1n);
// recipient KCC20State
ctrlPrefix.addData(hexToBytes(pubkey));
ctrlPrefix.addData(Uint8Array.from([IDENTIFIER_PUBKEY]));
ctrlPrefix.addI64(MINT_AMOUNT);
ctrlPrefix.addI64(0n);
ctrlPrefix.addI64(MINT_SELECTOR);
const ctrlPrefixHex = ctrlPrefix.drain();

writeFileSync(join(outDir, 'mint-js-asset-prefix.hex'), String(assetPrefixHex).replace(/^0x/i, ''));
writeFileSync(join(outDir, 'mint-js-ctrl-prefix.hex'), String(ctrlPrefixHex).replace(/^0x/i, ''));
writeFileSync(join(outDir, 'mint-authority-sig.hex'), authoritySigHex);

const assetUnlockHex = ScriptBuilder.fromScript(assetSpendScript, {
  flags: { covenantsEnabled: true },
}).encodePayToScriptHashSignatureScript(assetPrefixHex);
unsigned.inputs[0].signatureScript = assetUnlockHex;

const ctrlUnlockHex = ScriptBuilder.fromScript(spendControllerScript, {
  flags: { covenantsEnabled: true },
}).encodePayToScriptHashSignatureScript(ctrlPrefixHex);
unsigned.inputs[1].signatureScript = ctrlUnlockHex;

console.log(
  'Unlock script bytes: asset=',
  Math.ceil(String(assetUnlockHex).length / 2),
  'controller=',
  Math.ceil(String(ctrlUnlockHex).length / 2),
);

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
  writeFileSync(join(outDir, 'MINT_RESULT.json'), JSON.stringify(done, null, 2));
  const nextTip = {
    minterTxId: txid,
    minterIndex: 0,
    minterAddress,
    controllerTxId: txid,
    controllerIndex: 2,
    controllerAddress: postMintAddress,
    remainingAllowance: remainingAfter.toString(),
    assetCovenantId: ASSET_COV_ID,
    controllerCovenantId: CONTROLLER_COV_ID,
    lastBurnTxId: BURN_TXID,
    adminRenounced,
    migrateVersion: 3,
    network: 'testnet-10',
    updatedAt: new Date().toISOString(),
    ...(existsSync(join(outDir, 'template-parts.json'))
      ? { assetTemplate: JSON.parse(readFileSync(join(outDir, 'template-parts.json'), 'utf8')) }
      : {}),
    ...(existsSync(join(outDir, 'ticket-template-parts.json'))
      ? { ticketTemplate: JSON.parse(readFileSync(join(outDir, 'ticket-template-parts.json'), 'utf8')) }
      : {}),
    ...(existsSync(join(outDir, 'controller-template-parts.json'))
      ? {
          controllerTemplate: JSON.parse(
            readFileSync(join(outDir, 'controller-template-parts.json'), 'utf8'),
          ),
        }
      : {}),
  };
  writeFileSync(join(outDir, 'MINT_TIP.json'), JSON.stringify(nextTip, null, 2));
  const tipPost = await postHubMintTip(nextTip);
  console.log('Hub mint-tip POST', tipPost.ok ? 'ok' : tipPost);
  console.log('\nBroadcast OK');
  console.log(JSON.stringify(done, null, 2));
} finally {
  try {
    await rpc.disconnect();
  } catch {
    // ignore
  }
}
