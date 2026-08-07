/**
 * TN10 MigrateTicket genesis + 2-of-3 issue for one accepted burn.
 *
 * Env:
 *   TKREX_BURN_TXID, TKREX_MINT_AMOUNT_RAW, TKREX_CLAIMANT_PUBKEY (x-only)
 *   TKREX_TICKET_FUNDING_SOMPI (default 50_000_000)
 *   TKREX_WALLET3_PRIVKEY or --key-file  (funds genesis)
 *   TKREX_ATTESTOR{1,2,3}_PRIVKEY or tkrex-migrate-deploy/.attestor{1,2,3}.privkey
 *
 * Dry-run (default):
 *   node scripts/broadcast-tkrex-migrate-ticket-issue.mjs
 *
 * Broadcast:
 *   node scripts/broadcast-tkrex-migrate-ticket-issue.mjs --broadcast
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  ATTESTOR_THRESHOLD,
  compileWithExprs,
  loadAttestorRoster,
  resolveSilvercBin,
  ticketCtorExprs,
} from './lib/migrate-v3-ctor.mjs';
import {
  bytesToHex,
  encodeInactiveTicketState,
  encodeMigrateTicketState,
  hexToBytes,
  spliceTemplateScript,
} from './lib/migrate-state-encode.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const openSilverRoot = resolve(__dirname, '..');
const hubRoot = resolve(
  process.env.TKREX_HUB_ROOT?.trim() ||
    (existsSync(join(openSilverRoot, '../../public/kaspa-sdk/kaspa.js'))
      ? join(openSilverRoot, '../..')
      : join(openSilverRoot, '../DAPPS/kasparex-connect-wallet')),
);
const outDir = join(openSilverRoot, 'tkrex-migrate-deploy');
const silvercBin = resolveSilvercBin(openSilverRoot);
const WANT_BROADCAST = process.argv.includes('--broadcast');
const keyFileFlagIdx = process.argv.indexOf('--key-file');
const KEY_FILE =
  keyFileFlagIdx >= 0 ? resolve(process.cwd(), process.argv[keyFileFlagIdx + 1] || '') : '';

const BURN_TXID = (process.env.TKREX_BURN_TXID || '').trim().toLowerCase().replace(/^0x/i, '');
const AMOUNT_RAW = BigInt(process.env.TKREX_MINT_AMOUNT_RAW || '0');
const CLAIMANT = (process.env.TKREX_CLAIMANT_PUBKEY || '').trim().replace(/^0x/i, '').toLowerCase();
const FUNDING_SOMPI = BigInt(process.env.TKREX_TICKET_FUNDING_SOMPI || '50000000');
const PRIORITY_FEE_SOMPI = BigInt(process.env.TKREX_PRIORITY_FEE_SOMPI || '15000000');
const COMPUTE_BUDGET = Number(process.env.TKREX_COMPUTE_BUDGET || '200');
const ISSUE_SELECTOR = 0n;
/** Skip genesis and issue against an existing inactive ticket UTXO (txid). */
const RESUME_GENESIS_TXID = (process.env.TKREX_TICKET_GENESIS_TXID || '')
  .trim()
  .toLowerCase()
  .replace(/^0x/i, '');
const WALLET3 =
  process.env.TKREX_WALLET3_ADDRESS ||
  'kaspatest:qqn2344wcpyrp3w4jx8dc6zd0mn2ml4glgn84ufwv7em20udf2s9z8p8xc2zy';

if (!/^[a-f0-9]{64}$/.test(BURN_TXID)) throw new Error('Set TKREX_BURN_TXID');
if (AMOUNT_RAW <= 0n) throw new Error('Set TKREX_MINT_AMOUNT_RAW');
if (!/^[a-f0-9]{64}$/.test(CLAIMANT)) throw new Error('Set TKREX_CLAIMANT_PUBKEY (x-only)');

const roster = loadAttestorRoster(openSilverRoot, outDir);
const attestors = roster.attestors.map((a) => a.xOnlyPubkey.toLowerCase());

function loadPrivHex(candidates) {
  for (const p of candidates) {
    if (!p) continue;
    if (p.startsWith('env:')) {
      const v = (process.env[p.slice(4)] || '').trim().replace(/^0x/i, '').replace(/\s+/g, '');
      if (/^[0-9a-fA-F]{64}$/.test(v)) return v;
      continue;
    }
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, 'utf8')
      .trim()
      .split(/\r?\n/)[0]
      .trim()
      .replace(/^0x/i, '')
      .replace(/\s+/g, '');
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return raw;
  }
  return '';
}

function loadFundingPriv() {
  return loadPrivHex([
    'env:TKREX_WALLET3_PRIVKEY',
    KEY_FILE,
    join(outDir, 'wallet3.privkey'),
    join(outDir, '.wallet3.privkey'),
    join(outDir, '.attestor1.privkey'),
  ]);
}

function loadAttestorPriv(id) {
  return loadPrivHex([
    `env:TKREX_ATTESTOR${id}_PRIVKEY`,
    join(outDir, `.attestor${id}.privkey`),
    // Sibling OpenSilver soak layout (KREX/OpenSilver/…)
    join(openSilverRoot, `../../OpenSilver/tkrex-migrate-deploy/.attestor${id}.privkey`),
  ]);
}

const ticketArtifact = compileWithExprs(
  openSilverRoot,
  silvercBin,
  'contracts/tokens/migrate-ticket.sil',
  ticketCtorExprs(attestors, ATTESTOR_THRESHOLD),
  'ticket-issue',
);
const layout = ticketArtifact.state_layout || ticketArtifact.stateLayout;
if (!layout) throw new Error('ticket artifact missing state_layout');

const ticketTemplatePath = join(outDir, 'ticket-template-parts.json');
const ticketTemplate = existsSync(ticketTemplatePath)
  ? JSON.parse(readFileSync(ticketTemplatePath, 'utf8'))
  : null;

const inactiveState = encodeInactiveTicketState(ATTESTOR_THRESHOLD);
const activeState = encodeMigrateTicketState({
  threshold: ATTESTOR_THRESHOLD,
  burnTxId: BURN_TXID,
  amountRaw: AMOUNT_RAW,
  claimantXOnly: CLAIMANT,
  active: true,
});

let inactiveScript;
let activeScript;
if (ticketTemplate) {
  inactiveScript = spliceTemplateScript(ticketTemplate, inactiveState);
  activeScript = spliceTemplateScript(ticketTemplate, activeState);
} else {
  // Fall back to compiled genesis script (inactive defaults) for spend side.
  inactiveScript = Buffer.from(ticketArtifact.script);
  activeScript = Buffer.concat([
    inactiveScript.subarray(0, layout.start),
    activeState,
    inactiveScript.subarray(layout.start + layout.len),
  ]);
}

if (inactiveState.length !== Number(layout.len) || activeState.length !== Number(layout.len)) {
  throw new Error(
    `Ticket state len mismatch: layout=${layout.len} inactive=${inactiveState.length} active=${activeState.length}`,
  );
}

const dry = {
  network: 'testnet-10',
  migrateVersion: 3,
  burnTxId: BURN_TXID,
  amountRaw: AMOUNT_RAW.toString(),
  claimantXOnly: CLAIMANT,
  threshold: ATTESTOR_THRESHOLD,
  attestors,
  inactiveScriptHex: bytesToHex(inactiveScript),
  activeScriptHex: bytesToHex(activeScript),
  fundingSompi: FUNDING_SOMPI.toString(),
  note: WANT_BROADCAST
    ? 'Broadcasting genesis then 2-of-3 issue'
    : 'Dry-run: scripts + state splice ready. Re-run with --broadcast.',
  status: WANT_BROADCAST ? 'broadcast-pending' : 'dry-run',
  updatedAt: new Date().toISOString(),
};
writeFileSync(join(outDir, 'TICKET_ISSUE_DRY_RUN.json'), `${JSON.stringify(dry, null, 2)}\n`);
writeFileSync(join(outDir, 'ticket-issue-artifact.json'), JSON.stringify(ticketArtifact, null, 2));
console.log(JSON.stringify(dry, null, 2));

if (!WANT_BROADCAST) {
  console.log('\nDry-run only. Re-run with --broadcast (funding + ≥2 attestor keys).');
  process.exit(0);
}

const FUND_PRIV = loadFundingPriv();
if (!/^[0-9a-fA-F]{64}$/.test(FUND_PRIV)) {
  throw new Error('Missing funding privkey (TKREX_WALLET3_PRIVKEY or --key-file)');
}

const attestorKeys = [1, 2, 3].map((id) => ({
  id,
  pubkey: attestors[id - 1],
  priv: loadAttestorPriv(id),
}));
const signers = attestorKeys.filter((a) => /^[0-9a-fA-F]{64}$/.test(a.priv));
if (signers.length < ATTESTOR_THRESHOLD) {
  throw new Error(
    `Need ≥${ATTESTOR_THRESHOLD} attestor privkeys (have ${signers.length}). Set TKREX_ATTESTOR{1,2,3}_PRIVKEY or .attestorN.privkey files.`,
  );
}

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
  createTransactions,
  createTransaction,
  createInputSignature,
  payToScriptHashScript,
  addressFromScriptPublicKey,
  ScriptBuilder,
  ScriptPublicKey,
} = kaspa;

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

async function fetchUtxos(address) {
  const url = `https://api-tn10.kaspa.org/addresses/${encodeURIComponent(address)}/utxos`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`UTXO fetch failed: ${res.status}`);
  const raw = await res.json();
  const list = Array.isArray(raw) ? raw : raw.utxos || raw.result || [];
  return list.map((u) => {
    const outpoint = u.outpoint || u.previousOutpoint || {};
    const entry = u.utxoEntry || u.entry || u;
    const amount = BigInt(entry.amount ?? u.amount ?? 0);
    const spkRaw =
      entry.scriptPublicKey?.scriptPublicKey ||
      entry.scriptPublicKey?.script ||
      entry.scriptPublicKey ||
      u.scriptPublicKey ||
      '';
    const script =
      typeof spkRaw === 'string'
        ? spkRaw.replace(/^0x/i, '')
        : Buffer.from(spkRaw).toString('hex');
    return {
      address: new Address(address),
      outpoint: {
        transactionId: outpoint.transactionId || outpoint.transaction_id,
        index: Number(outpoint.index ?? outpoint.outpointIndex ?? 0),
      },
      amount,
      scriptHex: script,
      blockDaaScore: BigInt(entry.blockDaaScore ?? entry.block_daa_score ?? 0),
      isCoinbase: Boolean(entry.isCoinbase ?? entry.is_coinbase ?? false),
    };
  });
}

function toEntry(u) {
  return {
    address: u.address,
    outpoint: u.outpoint,
    amount: u.amount,
    scriptPublicKey: new ScriptPublicKey(0, u.scriptHex),
    blockDaaScore: u.blockDaaScore,
    isCoinbase: u.isCoinbase,
  };
}

const inactiveSpk = payToScriptHashScript(Uint8Array.from(inactiveScript));
const inactiveAddress = addressFromScriptPublicKey(inactiveSpk, 'testnet-10').toString();
const activeSpk = payToScriptHashScript(Uint8Array.from(activeScript));
const activeAddress = addressFromScriptPublicKey(activeSpk, 'testnet-10').toString();

const fundKey = new PrivateKey(FUND_PRIV);
const fundAddr = fundKey.toAddress('testnet-10').toString();
console.log('Funding address:', fundAddr);
console.log('Inactive ticket P2SH:', inactiveAddress);
console.log('Active ticket P2SH:', activeAddress);

const rpc = process.env.TKREX_RPC_URL
  ? new RpcClient({ url: process.env.TKREX_RPC_URL, encoding: Encoding.Borsh, networkId: 'testnet-10' })
  : new RpcClient({ resolver: new Resolver(), encoding: Encoding.Borsh, networkId: 'testnet-10' });

await rpc.connect();
let genesisTxId;
let genesisTx = null;
try {
  if (/^[a-f0-9]{64}$/.test(RESUME_GENESIS_TXID)) {
    genesisTxId = RESUME_GENESIS_TXID;
    console.log('Resuming issue from existing ticket genesis:', genesisTxId);
  } else {
    const utxos = await fetchUtxos(fundAddr);
    const need = FUNDING_SOMPI + PRIORITY_FEE_SOMPI + 10_000_000n;
    const funding = utxos
      .filter((u) => u.amount >= need)
      .filter((u) => !String(u.scriptHex || '').startsWith('aa20'))
      .sort((a, b) => (a.amount < b.amount ? -1 : 1))[0];
    if (!funding) throw new Error(`No funding UTXO >= ${need} sompi on ${fundAddr}`);

    const created = await createTransactions({
      version: 1,
      entries: [toEntry(funding)],
      outputs: [{ address: inactiveAddress, amount: FUNDING_SOMPI }],
      changeAddress: fundAddr,
      priorityFee: PRIORITY_FEE_SOMPI,
      networkId: 'testnet-10',
    });
    if (!created.transactions?.length) throw new Error('createTransactions returned no txs');
    if (created.transactions.length > 1) {
      throw new Error(`Generator produced ${created.transactions.length} txs; pick a smaller funding UTXO`);
    }

    const pending = created.transactions[0];
    genesisTx = pending.transaction;
    genesisTx.version = 1;
    for (const tin of genesisTx.inputs) {
      tin.sigOpCount = 0;
      tin.computeBudget = COMPUTE_BUDGET;
    }
    genesisTx.populateGenesisCovenants([{ authorizingInput: 0, outputs: [0] }]);
    genesisTx.finalize();

    const fundSig = createInputSignature(genesisTx, 0, fundKey);
    genesisTx.inputs[0].signatureScript = fundSig;

    const g = await rpc.submitTransaction({ transaction: genesisTx, allowOrphan: false });
    genesisTxId = String(g?.transactionId || g?.transaction_id || genesisTx.id?.toString?.() || '');
    if (!genesisTxId) throw new Error('Genesis submit returned no txid');
    console.log('Ticket genesis submitted:', genesisTxId);
  }

  // Brief wait for UTXO index; retry fetch.
  let genesisUtxo = null;
  for (let i = 0; i < 12; i++) {
    const list = await fetchUtxos(inactiveAddress);
    genesisUtxo = list.find(
      (u) =>
        String(u.outpoint.transactionId).toLowerCase() === genesisTxId &&
        Number(u.outpoint.index) === 0,
    );
    if (genesisUtxo) break;
    if (/^[a-f0-9]{64}$/.test(RESUME_GENESIS_TXID) && i === 0) {
      // Already indexed from prior attempt; still allow a couple retries.
    }
    console.log(`Waiting for genesis UTXO… (${i + 1}/12)`);
    await new Promise((r) => setTimeout(r, 2500));
  }
  if (!genesisUtxo) throw new Error(`Genesis UTXO ${genesisTxId}:0 not found on ${inactiveAddress}`);

  const ticketAmount = genesisUtxo.amount;
  const ticketEntry = {
    address: new Address(inactiveAddress),
    outpoint: { transactionId: genesisTxId, index: 0 },
    amount: ticketAmount,
    scriptPublicKey: inactiveSpk,
    blockDaaScore: genesisUtxo.blockDaaScore,
    isCoinbase: false,
    covenantId: genesisTx?.outputs?.[0]?.covenant?.covenantId?.toString?.() || undefined,
  };

  // Discover covenant id from genesis output if present.
  const genesisCov =
    genesisTx?.outputs?.[0]?.covenant?.covenantId?.toString?.() ||
    genesisTx?.outputs?.[0]?.covenant?.covenant_id?.toString?.();
  if (genesisCov) ticketEntry.covenantId = String(genesisCov);
  // Resume: do NOT use P2SH script hash (aa20…87) as covenant id; that fails genesis hashing.
  // Prefer env, else require a live genesis tx object from this run.
  if (!ticketEntry.covenantId) {
    const fromEnv = (process.env.TKREX_TICKET_COVENANT_ID || '').trim().toLowerCase().replace(/^0x/i, '');
    if (/^[a-f0-9]{64}$/.test(fromEnv)) ticketEntry.covenantId = fromEnv;
  }
  if (!ticketEntry.covenantId) {
    throw new Error(
      'Missing ticket covenant id. Re-run without TKREX_TICKET_GENESIS_TXID, or set TKREX_TICKET_COVENANT_ID from the genesis output.',
    );
  }

  const keep = ticketAmount - PRIORITY_FEE_SOMPI;
  if (keep <= 0n) throw new Error('Ticket UTXO too small for issue fee');

  const issueTx = createTransaction(
    [ticketEntry],
    [{ address: activeAddress, amount: keep }],
    PRIORITY_FEE_SOMPI,
  );
  issueTx.version = 1;
  // TN10 tx version 1: sigOpCount must be 0 (same as handover / mint scripts).
  for (const tin of issueTx.inputs) {
    tin.sigOpCount = 0;
    tin.computeBudget = COMPUTE_BUDGET;
  }
  if (ticketEntry.covenantId) {
    issueTx.outputs[0].covenant = new CovenantBinding(0, new Hash(ticketEntry.covenantId));
  }

  // Sign with first two available attestors; third slot uses third roster pubkey + invalid sig.
  const s1 = signers[0];
  const s2 = signers[1];
  const s3 =
    signers.find((s) => s.pubkey !== s1.pubkey && s.pubkey !== s2.pubkey) ||
    attestorKeys.find((a) => a.pubkey !== s1.pubkey && a.pubkey !== s2.pubkey);
  if (!s3) throw new Error('Could not pick distinct third signer pubkey');

  const key1 = new PrivateKey(s1.priv);
  const key2 = new PrivateKey(s2.priv);
  const raw1 = createInputSignature(issueTx, 0, key1, [ticketEntry]);
  const raw2 = createInputSignature(issueTx, 0, key2, [ticketEntry]);
  const sig1 = normalizeSchnorrSignature(raw1);
  const sig2 = normalizeSchnorrSignature(raw2);
  const dummySig = new Uint8Array(65);
  dummySig[64] = 0x01;

  // newState + signer1,sig1,signer2,sig2,signer3,sig3 + selector
  const prefix = new ScriptBuilder();
  prefix.addI64(BigInt(ATTESTOR_THRESHOLD));
  prefix.addData(hexToBytes(BURN_TXID));
  prefix.addI64(AMOUNT_RAW);
  prefix.addData(hexToBytes(CLAIMANT));
  prefix.addI64(1n); // active
  prefix.addData(hexToBytes(s1.pubkey));
  prefix.addData(sig1);
  prefix.addData(hexToBytes(s2.pubkey));
  prefix.addData(sig2);
  prefix.addData(hexToBytes(s3.pubkey));
  prefix.addData(
    /^[0-9a-fA-F]{64}$/.test(s3.priv)
      ? normalizeSchnorrSignature(createInputSignature(issueTx, 0, new PrivateKey(s3.priv), [ticketEntry]))
      : dummySig,
  );
  prefix.addI64(ISSUE_SELECTOR);
  const prefixHex = prefix.drain();

  const unlockHex = ScriptBuilder.fromScript(Uint8Array.from(inactiveScript), {
    flags: { covenantsEnabled: true },
  }).encodePayToScriptHashSignatureScript(prefixHex);
  issueTx.inputs[0].signatureScript = unlockHex;

  const issued = await rpc.submitTransaction({ transaction: issueTx, allowOrphan: false });
  const issueTxId = String(issued?.transactionId || issued?.transaction_id || issueTx.id?.toString?.() || '');
  if (!issueTxId) throw new Error('Issue submit returned no txid');

  const result = {
    network: 'testnet-10',
    migrateVersion: 3,
    burnTxId: BURN_TXID,
    amountRaw: AMOUNT_RAW.toString(),
    claimantXOnly: CLAIMANT,
    genesisTxId,
    ticketTxId: issueTxId,
    ticketIndex: 0,
    ticketId: `${issueTxId}:0`,
    ticketAddress: activeAddress,
    covenantId: ticketEntry.covenantId || null,
    explorer: `https://tn10.kaspa.stream/transactions/${issueTxId}`,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(join(outDir, 'TICKET_ISSUE_RESULT.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log('\nTicket issued OK');
  console.log(JSON.stringify(result, null, 2));
} finally {
  try {
    await rpc.disconnect();
  } catch {
    // ignore
  }
}
