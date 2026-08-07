/**
 * TN10 keyless migrate attestor.
 *
 * Default: AUTO_MINT on against live soak tip (v2 / 83b999) so burns complete.
 * When Hub tip has migrateVersion >= 3 (and no legacyNote), issues a MigrateTicket
 * and POSTs real ticketId (txid:index). User Claims in Hub; AUTO_MINT stays off for v3.
 *
 *   node scripts/tkrex-migrate-attestor.mjs --once
 *   KCC20_MIGRATE_AUTO_MINT=0 to attest-only (even on v2 soak)
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
const migrateOutDir = join(openSilverRoot, 'tkrex-migrate-deploy');
const statePath = join(outDir, 'migrate-attestor-state.json');
const mintScript = join(openSilverRoot, 'scripts/broadcast-tkrex-migrate-mint-v2-soak.mjs');
const mintScriptV3 = join(openSilverRoot, 'scripts/broadcast-tkrex-migrate-mint.mjs');
const ticketIssueScript = join(openSilverRoot, 'scripts/broadcast-tkrex-migrate-ticket-issue.mjs');
const mintResultPath = join(migrateOutDir, 'MINT_RESULT.json');
const ticketResultPath = join(migrateOutDir, 'TICKET_ISSUE_RESULT.json');

const HUB_URL = (process.env.KREX_WRAP_HUB_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const SECRET =
  process.env.KCC20_MIGRATE_ATTESTOR_SECRET?.trim() ||
  process.env.KCC20_BRIDGE_WATCHER_SECRET?.trim() ||
  '';
const TICK = (process.env.KCC20_MIGRATE_TICK || 'TKREX').trim().toUpperCase();
const SINK =
  process.env.KCC20_MIGRATE_SINK?.trim() ||
  'kaspatest:pqw2y985nkrstxa7x30rkckq6y8papu48tv688vak9eyew2fc9r9vdf0hcw87';
const AUTO_MINT = process.env.KCC20_MIGRATE_AUTO_MINT !== '0';
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

function readMintTip() {
  for (const tipPath of [join(migrateOutDir, 'MINT_TIP.json'), join(outDir, 'MINT_TIP.json')]) {
    try {
      if (!existsSync(tipPath)) continue;
      return JSON.parse(readFileSync(tipPath, 'utf8'));
    } catch {
      // continue
    }
  }
  return null;
}

function tipIsV3TicketMode(tip) {
  if (!tip) return false;
  if (tip.legacyNote) return false;
  if (Number(tip.migrateVersion || 0) >= 3) return true;
  const asset = String(tip.assetCovenantId || '').toLowerCase();
  // Historical soak asset stays on v2 AUTO_MINT path.
  if (asset === '83b999756e613d2749b8ff9549de4bdd0cb864f3d5d2dc606d92f3aa740ee91a') return false;
  return false;
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
          ...(a.ticketId ? { ticketId: String(a.ticketId) } : {}),
        };
        changed += 1;
      } else if (prev.status !== 'claimed' && status === 'attested') {
        state.nullifiers[burnTxHash] = {
          ...prev,
          status: 'attested',
          ...(a.ticketId ? { ticketId: String(a.ticketId) } : {}),
        };
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
    const accepted = op.opAccept === true || op.opAccept === 1 || op.opAccept === '1';
    return isTransfer && toSink && tickOk && accepted;
  });
}

function tipMigrateVersionHint() {
  const tip = readMintTip();
  return Number(tip?.migrateVersion || 2);
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

function tryIssueTicket({ amountRaw, burnTxHash, claimantPubkey }) {
  mkdirSync(migrateOutDir, { recursive: true });
  if (existsSync(ticketResultPath)) {
    try {
      const prev = JSON.parse(readFileSync(ticketResultPath, 'utf8'));
      if (String(prev.burnTxId || '').toLowerCase() === burnTxHash && prev.ticketId) {
        console.log('Reusing prior TICKET_ISSUE_RESULT for burn', burnTxHash);
        return prev;
      }
    } catch {
      // continue
    }
  }
  const env = {
    ...process.env,
    TKREX_MINT_AMOUNT_RAW: String(amountRaw),
    TKREX_BURN_TXID: burnTxHash,
    TKREX_CLAIMANT_PUBKEY: claimantPubkey,
    TKREX_HUB_ROOT: hubRoot,
    KREX_WRAP_HUB_URL: HUB_URL,
  };
  if (SECRET) {
    env.KCC20_BRIDGE_WATCHER_SECRET = SECRET;
    env.KCC20_MIGRATE_ATTESTOR_SECRET = SECRET;
  }
  const result = execFileSync(process.execPath, [ticketIssueScript, '--broadcast'], {
    cwd: openSilverRoot,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log(result);
  if (!existsSync(ticketResultPath)) throw new Error('TICKET_ISSUE_RESULT.json missing');
  return JSON.parse(readFileSync(ticketResultPath, 'utf8'));
}

function tryMint({ amountRaw, burnTxHash, recipientPubkey, recipientAddress, ticketId }) {
  const tip = readMintTip();
  const useV3 = tipIsV3TicketMode(tip);
  const script = useV3 ? mintScriptV3 : mintScript;
  console.log(`Mint via ${useV3 ? 'v3 ticket path' : 'v2-soak AUTO_MINT path'}`);
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
  if (useV3 && ticketId) {
    const [txid, idx] = String(ticketId).split(':');
    env.TKREX_TICKET_TXID = txid;
    env.TKREX_TICKET_INDEX = String(idx || '0');
  }
  const result = execFileSync(process.execPath, [script, '--broadcast'], {
    cwd: openSilverRoot,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log(result);
  if (!existsSync(mintResultPath)) throw new Error('tkrex-migrate-deploy/MINT_RESULT.json missing');
  return JSON.parse(readFileSync(mintResultPath, 'utf8'));
}

async function issueTicketForBurn(state, burnTxHash, entry) {
  if (entry.ticketId && /^[a-f0-9]{64}:\d+$/.test(entry.ticketId)) {
    console.log('Ticket already issued', entry.ticketId);
    return entry;
  }
  const claimantPubkey = await resolveRecipientPubkey(entry.from);
  if (!/^[0-9a-f]{64}$/.test(claimantPubkey)) {
    throw new Error(`Cannot resolve claimant x-only pubkey from ${entry.from}`);
  }
  const ticket = tryIssueTicket({
    amountRaw: entry.amountRaw,
    burnTxHash,
    claimantPubkey,
  });
  const ticketId = String(ticket.ticketId || `${ticket.ticketTxId}:0`);
  state.nullifiers[burnTxHash] = {
    ...entry,
    status: 'attested',
    ticketId,
    ticketTxId: ticket.ticketTxId,
    ticketIndex: Number(ticket.ticketIndex ?? 0),
    claimantPubkey,
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
    status: 'attested',
    ticketId,
    ticketTxId: ticket.ticketTxId,
    ticketIndex: Number(ticket.ticketIndex ?? 0),
    note: 'TN10 v3: MigrateTicket issued; user Claims in Hub',
    migrateVersion: 3,
  });
  console.log('Ticket issued', ticketId);
  return state.nullifiers[burnTxHash];
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
    ticketId: entry.ticketId,
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
    ticketId: entry.ticketId,
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

/** Mint any attested-but-unclaimed burns (v2 soak only). */
async function mintPendingAttested(state, useV3) {
  if (!AUTO_MINT || useV3) return 0;
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

/** Issue tickets for attested burns missing ticketId (v3). */
async function issuePendingTickets(state) {
  let n = 0;
  for (const [burnTxHash, entry] of Object.entries(state.nullifiers)) {
    if (entry.status !== 'attested') continue;
    if (entry.ticketId && /^[a-f0-9]{64}:\d+$/.test(entry.ticketId)) continue;
    console.log(`Pending ticket issue for attested burn ${burnTxHash}`);
    try {
      await issueTicketForBurn(state, burnTxHash, entry);
      n += 1;
    } catch (err) {
      console.error('Ticket issue failed', err instanceof Error ? err.message : err);
      break;
    }
  }
  return n;
}

async function fetchTn10Tx(txid) {
  const res = await fetch(`https://api-tn10.kaspa.org/transactions/${txid}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchTn10Utxos(address) {
  const res = await fetch(
    `https://api-tn10.kaspa.org/addresses/${encodeURIComponent(address)}/utxos`,
  );
  if (!res.ok) return [];
  const raw = await res.json();
  const list = Array.isArray(raw) ? raw : raw.utxos || raw.result || [];
  return list
    .map((u) => {
      const op = u.outpoint || u.previousOutpoint || {};
      return {
        txId: String(op.transactionId || op.transaction_id || '')
          .trim()
          .toLowerCase(),
        index: Number(op.index ?? op.outpointIndex ?? 0),
      };
    })
    .filter((x) => /^[a-f0-9]{64}$/.test(x.txId));
}

function parseTicketId(ticketId) {
  const m = /^([a-f0-9]{64}):(\d+)$/.exec(String(ticketId || '').trim().toLowerCase());
  if (!m) return null;
  return { txId: m[1], index: Number(m[2]) };
}

/** Mark Hub claimed + advance tip when user already spent the ticket. */
async function reconcileSpentTickets(state, tip) {
  if (!tip?.minterAddress) return 0;
  let n = 0;
  const live = await fetchTn10Utxos(tip.minterAddress);
  const candidates = new Set(live.map((u) => u.txId));
  for (const [burnTxHash, entry] of Object.entries(state.nullifiers)) {
    if (entry.status === 'claimed' && entry.mintTxHash) continue;
    const ticket = parseTicketId(entry.ticketId);
    if (!ticket) continue;
    let mintTxHash = null;
    for (const txId of candidates) {
      const tx = await fetchTn10Tx(txId);
      const spends = (tx?.inputs || []).some((inp) => {
        const prev = String(inp.previous_outpoint_hash || '')
          .trim()
          .toLowerCase();
        const idx = Number(inp.previous_outpoint_index ?? -1);
        return prev === ticket.txId && idx === ticket.index;
      });
      if (spends) {
        mintTxHash = txId;
        break;
      }
    }
    if (!mintTxHash) continue;
    console.log(`Reconcile spent ticket → claim ${burnTxHash} mint=${mintTxHash}`);
    const report = await fetch(`${HUB_URL}/api/krex-wrap/mint-receipts?mode=claim-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ burnTxHash, mintTxHash }),
    });
    const json = await report.json().catch(() => ({}));
    if (!report.ok || !json.ok) {
      console.error('claim-report failed', report.status, json);
      continue;
    }
    state.nullifiers[burnTxHash] = {
      ...entry,
      status: 'claimed',
      mintTxHash,
      claimedAt: new Date().toISOString(),
    };
    saveState(state);
    n += 1;
  }
  return n;
}

async function scanOnce() {
  let state = loadState();
  state = await hydrateNullifiersFromHub(state);
  const tip = readMintTip();
  const useV3 = tipIsV3TicketMode(tip);
  const transfers = await fetchSinkTransfers();
  console.log(
    `Attestor scan: ${transfers.length} sink transfers, nullifiers=${Object.keys(state.nullifiers).length}, mode=${useV3 ? 'v3-ticket' : 'v2-soak'}`,
  );

  let attested = 0;
  for (const op of transfers) {
    const burnTxHash = String(op.txId || op.hashRev || '')
      .trim()
      .toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(burnTxHash)) continue;

    const existing = state.nullifiers[burnTxHash];
    if (existing?.status === 'claimed') continue;
    if (existing?.status === 'attested' && (!useV3 || existing.ticketId)) continue;

    const amountRaw = String(op.amt || '0');
    const amount = Number(amountRaw) / 1e8;
    const from = String(op.from || '');

    console.log(`Attest burn ${burnTxHash} amountRaw=${amountRaw} from=${from}`);

    // Nullifier FIRST so a crash mid-path cannot double-attest.
    state.nullifiers[burnTxHash] = {
      amountRaw,
      from,
      attestedAt: new Date().toISOString(),
      status: 'attested',
      ...(existing?.ticketId ? { ticketId: existing.ticketId } : {}),
    };
    saveState(state);

    if (useV3) {
      try {
        await issueTicketForBurn(state, burnTxHash, state.nullifiers[burnTxHash]);
      } catch (err) {
        // Still post burn attestation without ticket so Hub shows Attested.
        await postAttestation({
          burnTxHash,
          tick: TICK,
          amountRaw,
          amount,
          from,
          sinkAddress: SINK,
          claimantAddress: from,
          status: 'attested',
          note: `TN10 v3: attested; ticket issue pending (${err instanceof Error ? err.message : err})`,
          migrateVersion: 3,
        });
        console.error('Ticket issue failed', err instanceof Error ? err.message : err);
      }
    } else {
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
        note: 'TN10 soak: attested; AUTO_MINT claims against live tip until v3 ticket deploy',
        migrateVersion: tipMigrateVersionHint(),
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
    }

    attested += 1;
  }

  const ticketsIssued = useV3 ? await issuePendingTickets(state) : 0;
  const pendingMinted = await mintPendingAttested(state, useV3);
  const claimsReconciled = useV3 ? await reconcileSpentTickets(state, tip) : 0;
  return { attested, pendingMinted, ticketsIssued, claimsReconciled };
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  mkdirSync(migrateOutDir, { recursive: true });
  const tip = readMintTip();
  console.log({
    HUB_URL,
    TICK,
    SINK,
    AUTO_MINT,
    hasSecret: Boolean(SECRET),
    hubRoot,
    MINT_BURN: MINT_BURN || null,
    tipMode: tipIsV3TicketMode(tip) ? 'v3-ticket' : 'v2-soak',
    tipMigrateVersion: tip?.migrateVersion ?? null,
  });
  if (MINT_BURN) {
    if (!/^[a-f0-9]{64}$/.test(MINT_BURN)) throw new Error('--mint-burn expects 64 hex txid');
    await mintExistingBurn(MINT_BURN);
    return;
  }
  if (WANT_ONCE) {
    const n = await scanOnce();
    console.log(
      `Done. attestedNow=${n.attested} pendingMinted=${n.pendingMinted} ticketsIssued=${n.ticketsIssued} claimsReconciled=${n.claimsReconciled || 0}`,
    );
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
