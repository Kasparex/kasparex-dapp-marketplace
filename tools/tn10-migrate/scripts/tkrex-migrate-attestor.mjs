/**
 * TN10 keyless migrate attestor (N=1 soak).
 *
 * Watches Kasplex for KRC-20 transfers into the published keyless sink,
 * refuses double-attest (nullifier), posts Hub attestations, and optionally
 * mints via broadcast-tkrex-migrate-mint.mjs (KCC20Migrate + burnTxId).
 *
 *   node scripts/tkrex-migrate-attestor.mjs --once
 *   node scripts/tkrex-migrate-attestor.mjs --loop
 *   node scripts/tkrex-migrate-attestor.mjs --mint-burn <txid>   # mint already-attested burn
 *
 * Env:
 *   KREX_WRAP_HUB_URL
 *   KCC20_MIGRATE_ATTESTOR_SECRET (or KCC20_BRIDGE_WATCHER_SECRET)
 *   KCC20_MIGRATE_SINK (optional override)
 *   KCC20_MIGRATE_TICK (default TKREX)
 *   KCC20_MIGRATE_AUTO_MINT=1 to call broadcast-tkrex-migrate-mint.mjs after attest
 *   TKREX_WALLET3_PRIVKEY (preferred in CI; no key file)
 *   TKREX_HUB_ROOT (Hub checkout for kaspa WASM)
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const openSilverRoot = resolve(__dirname, '..');
const hubRoot = resolve(
  process.env.TKREX_HUB_ROOT?.trim() || join(openSilverRoot, '../DAPPS/kasparex-connect-wallet'),
);
const outDir = join(openSilverRoot, 'tkrex-deploy');
const statePath = join(outDir, 'migrate-attestor-state.json');
const mintScript = join(openSilverRoot, 'scripts/broadcast-tkrex-migrate-mint.mjs');
const mintResultPath = join(openSilverRoot, 'tkrex-migrate-deploy/MINT_RESULT.json');

const HUB_URL = (process.env.KREX_WRAP_HUB_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const SECRET =
  process.env.KCC20_MIGRATE_ATTESTOR_SECRET?.trim() ||
  process.env.KCC20_BRIDGE_WATCHER_SECRET?.trim() ||
  '';
const TICK = (process.env.KCC20_MIGRATE_TICK || 'TKREX').trim().toUpperCase();
const SINK =
  process.env.KCC20_MIGRATE_SINK?.trim() ||
  'kaspatest:pqw2y985nkrstxa7x30rkckq6y8papu48tv688vak9eyew2fc9r9vdf0hcw87';
const AUTO_MINT = process.env.KCC20_MIGRATE_AUTO_MINT === '1';
const KASPLEX = 'https://tn10api.kasplex.org';
const WANT_ONCE = process.argv.includes('--once');
const mintBurnIdx = process.argv.indexOf('--mint-burn');
const MINT_BURN =
  mintBurnIdx >= 0 ? String(process.argv[mintBurnIdx + 1] || '').trim().toLowerCase() : '';
const WANT_LOOP = process.argv.includes('--loop') || (!WANT_ONCE && !MINT_BURN);

function stripHrp(addr) {
  return String(addr || '')
    .replace(/^kaspa(test)?:/i, '')
    .toLowerCase();
}

function loadState() {
  if (!existsSync(statePath)) return { nullifiers: {}, updatedAt: null };
  try {
    return JSON.parse(readFileSync(statePath, 'utf8'));
  } catch {
    return { nullifiers: {}, updatedAt: null };
  }
}

function saveState(state) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    statePath,
    `${JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2)}\n`,
  );
}

/** Hydrate local nullifiers from Hub so ephemeral GHA runners do not remint. */
async function hydrateNullifiersFromHub(state) {
  try {
    const res = await fetch(`${HUB_URL}/api/krex-wrap/mint-receipts?mode=attest`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return state;
    const json = await res.json();
    const rows = Array.isArray(json.attestations) ? json.attestations : [];
    let changed = 0;
    for (const a of rows) {
      const burnTxHash = String(a.burnTxHash || '')
        .trim()
        .toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(burnTxHash)) continue;
      const status = a.status === 'claimed' ? 'claimed' : a.status === 'rejected' ? 'rejected' : 'attested';
      const prev = state.nullifiers[burnTxHash];
      if (prev?.status === 'claimed' && prev.mintTxHash) continue;
      if (status === 'claimed' || !prev) {
        state.nullifiers[burnTxHash] = {
          amountRaw: String(a.amountRaw || prev?.amountRaw || '0'),
          from: String(a.from || prev?.from || ''),
          attestedAt: a.attestedAt || prev?.attestedAt || new Date().toISOString(),
          status,
          ...(a.mintTxHash ? { mintTxHash: String(a.mintTxHash).toLowerCase() } : {}),
        };
        changed += 1;
      } else if (prev.status !== 'claimed' && status === 'attested') {
        state.nullifiers[burnTxHash] = { ...prev, status: 'attested' };
      }
    }
    if (changed > 0) {
      saveState(state);
      console.log(`Hydrated ${changed} nullifier(s) from Hub`);
    }
  } catch (err) {
    console.warn('Hub nullifier hydrate failed:', err instanceof Error ? err.message : err);
  }
  return state;
}

async function fetchSinkTransfers() {
  const url = `${KASPLEX}/v1/krc20/oplist?tick=${encodeURIComponent(TICK)}&address=${encodeURIComponent(SINK)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Kasplex ${res.status}`);
  const json = await res.json();
  const ops = Array.isArray(json.result) ? json.result : [];
  const sinkNorm = stripHrp(SINK);
  return ops.filter((op) => {
    const isTransfer = String(op.op || '').toLowerCase() === 'transfer';
    const toSink = stripHrp(op.to) === sinkNorm;
    const tickOk = String(op.tick || '').toUpperCase() === TICK;
    const accepted =
      op.opAccept === true ||
      op.opAccept === 1 ||
      op.opAccept === '1' ||
      op.opAccept == null;
    return isTransfer && toSink && tickOk && accepted;
  });
}

async function postAttestation(body) {
  if (!SECRET) {
    console.warn('No attestor secret; writing local attestation only');
    return { ok: false, localOnly: true };
  }
  const res = await fetch(`${HUB_URL}/api/krex-wrap/mint-receipts?mode=attest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SECRET}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function resolveRecipientPubkey(fromAddress) {
  if (!fromAddress) return '';
  try {
    const kaspaJs = pathToFileURL(join(hubRoot, 'public/kaspa-sdk/kaspa.js')).href;
    const wasmBytes = readFileSync(join(hubRoot, 'public/kaspa-sdk/kaspa_bg.wasm'));
    const kaspa = await import(kaspaJs);
    await kaspa.default({ module_or_path: wasmBytes });
    const x = kaspa.XOnlyPublicKey.fromAddress(new kaspa.Address(fromAddress));
    const hex = String(x).replace(/^0x/i, '').toLowerCase();
    if (/^[0-9a-f]{64}$/.test(hex)) return hex;
  } catch (err) {
    console.warn('Pubkey resolve failed:', err instanceof Error ? err.message : err);
  }
  return '';
}

function tryMint({ amountRaw, burnTxHash, recipientPubkey, recipientAddress }) {
  const env = {
    ...process.env,
    TKREX_MINT_AMOUNT_RAW: String(amountRaw),
    TKREX_BURN_TXID: burnTxHash,
    TKREX_DEPOSIT_TXID: burnTxHash,
    KREX_WRAP_HUB_URL: HUB_URL,
    TKREX_HUB_ROOT: hubRoot,
  };
  if (SECRET) {
    env.KCC20_BRIDGE_WATCHER_SECRET = SECRET;
    env.KCC20_MIGRATE_ATTESTOR_SECRET = SECRET;
  }
  if (recipientPubkey) env.TKREX_RECIPIENT_PUBKEY = recipientPubkey;
  if (recipientAddress) env.TKREX_RECIPIENT_ADDRESS = recipientAddress;
  const result = execFileSync(process.execPath, [mintScript, '--broadcast'], {
    cwd: openSilverRoot,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log(result);
  if (!existsSync(mintResultPath)) throw new Error('tkrex-migrate-deploy/MINT_RESULT.json missing');
  return JSON.parse(readFileSync(mintResultPath, 'utf8'));
}

async function claimMint(state, burnTxHash, entry) {
  if (entry.status === 'claimed' && entry.mintTxHash) {
    console.log('Already claimed', entry.mintTxHash);
    return entry;
  }
  const recipientPubkey = await resolveRecipientPubkey(entry.from);
  const mint = tryMint({
    amountRaw: entry.amountRaw,
    burnTxHash,
    recipientPubkey,
    recipientAddress: entry.from,
  });
  const mintTxHash = String(mint.submittedTxId || mint.unsignedTxId || '')
    .trim()
    .toLowerCase();
  state.nullifiers[burnTxHash] = {
    ...entry,
    status: 'claimed',
    mintTxHash,
    claimedAt: new Date().toISOString(),
  };
  saveState(state);
  await postAttestation({
    burnTxHash,
    tick: TICK,
    amountRaw: entry.amountRaw,
    amount: Number(entry.amountRaw) / 1e8,
    from: entry.from,
    sinkAddress: SINK,
    claimantAddress: entry.from,
    status: 'claimed',
    mintTxHash,
    assetCovenantId: mint.assetCovenantId,
    note: 'Claimed via attestor-assisted KCC20Migrate mint (soak)',
  });
  console.log('Minted', mintTxHash);
  return state.nullifiers[burnTxHash];
}

async function mintExistingBurn(burnTxHash) {
  let state = loadState();
  state = await hydrateNullifiersFromHub(state);
  const entry = state.nullifiers[burnTxHash];
  if (!entry) throw new Error(`No nullifier for ${burnTxHash}; run attestor --once first`);
  return claimMint(state, burnTxHash, entry);
}

/** Mint any attested-but-unclaimed burns (crash recovery / prior attest-only runs). */
async function mintPendingAttested(state) {
  if (!AUTO_MINT) return 0;
  let minted = 0;
  for (const [burnTxHash, entry] of Object.entries(state.nullifiers)) {
    if (entry.status !== 'attested') continue;
    if (entry.mintTxHash) continue;
    console.log(`Pending claim for attested burn ${burnTxHash}`);
    try {
      await claimMint(state, burnTxHash, entry);
      minted += 1;
    } catch (err) {
      console.error('Pending mint failed', err instanceof Error ? err.message : err);
      break;
    }
  }
  return minted;
}

async function scanOnce() {
  let state = loadState();
  state = await hydrateNullifiersFromHub(state);
  const transfers = await fetchSinkTransfers();
  console.log(
    `Attestor scan: ${transfers.length} sink transfers, nullifiers=${Object.keys(state.nullifiers).length}`,
  );

  let attested = 0;
  for (const op of transfers) {
    const burnTxHash = String(op.txId || op.hashRev || '')
      .trim()
      .toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(burnTxHash)) continue;

    const existing = state.nullifiers[burnTxHash];
    if (existing?.status === 'claimed') continue;
    if (existing?.status === 'attested') continue;

    const amountRaw = String(op.amt || '0');
    const amount = Number(amountRaw) / 1e8;
    const from = String(op.from || '');

    console.log(`Attest burn ${burnTxHash} amountRaw=${amountRaw} from=${from}`);

    // Nullifier FIRST so a crash mid-mint cannot double-attest.
    state.nullifiers[burnTxHash] = {
      amountRaw,
      from,
      attestedAt: new Date().toISOString(),
      status: 'attested',
    };
    saveState(state);

    const posted = await postAttestation({
      burnTxHash,
      tick: TICK,
      amountRaw,
      amount,
      from,
      sinkAddress: SINK,
      claimantAddress: from,
      status: 'attested',
      ticketId: burnTxHash,
      note: 'TN10 N=1 attestor observation (mechanism soak)',
    });

    if (!posted.ok && posted.status === 409) {
      const hubRow = posted.json?.attestation;
      console.log('Attestation POST 409 (adopt Hub)', hubRow?.status || posted);
      if (hubRow?.status === 'claimed') {
        state.nullifiers[burnTxHash] = {
          amountRaw: String(hubRow.amountRaw || amountRaw),
          from: String(hubRow.from || from),
          attestedAt: hubRow.attestedAt || new Date().toISOString(),
          status: 'claimed',
          mintTxHash: hubRow.mintTxHash ? String(hubRow.mintTxHash).toLowerCase() : undefined,
        };
        saveState(state);
        continue;
      }
      // Already attested on Hub: keep local attested and let AUTO_MINT claim below.
    } else {
      console.log('Attestation POST', posted.ok ? 'ok' : posted);
    }

    if (AUTO_MINT && state.nullifiers[burnTxHash]?.status === 'attested') {
      try {
        await claimMint(state, burnTxHash, state.nullifiers[burnTxHash]);
      } catch (err) {
        console.error('Auto-mint failed', err instanceof Error ? err.message : err);
      }
    }

    attested += 1;
  }

  const pendingMinted = await mintPendingAttested(state);
  return { attested, pendingMinted };
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  console.log({
    HUB_URL,
    TICK,
    SINK,
    AUTO_MINT,
    hasSecret: Boolean(SECRET),
    hubRoot,
    MINT_BURN: MINT_BURN || null,
  });
  if (MINT_BURN) {
    if (!/^[a-f0-9]{64}$/.test(MINT_BURN)) throw new Error('--mint-burn expects 64 hex txid');
    await mintExistingBurn(MINT_BURN);
    return;
  }
  if (WANT_ONCE) {
    const n = await scanOnce();
    console.log(`Done. attestedNow=${n.attested} pendingMinted=${n.pendingMinted}`);
    return;
  }
  if (WANT_LOOP) {
    for (;;) {
      try {
        await scanOnce();
      } catch (err) {
        console.error(err);
      }
      await new Promise((r) => setTimeout(r, 20_000));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
