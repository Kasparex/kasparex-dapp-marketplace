import { NextRequest, NextResponse } from 'next/server';
import {
  findMintReceipt,
  normalizeTxHash,
  upsertMintReceipt,
  type KrexWrapMintReceipt,
} from '@/lib/krex/wrap/mintReceipts';
import {
  findAttestation,
  loadAttestationStore,
  loadMigrateMintTip,
  loadMintReceiptStore,
  persistMigrateMintTip,
  persistMintReceiptStore,
  upsertAttestation,
} from '@/lib/krex/wrap/mintReceiptStore';
import type { MigrateAttestation } from '@/lib/krex/wrap/migrateV2';

export const runtime = 'nodejs';

function watcherSecretExpected(): string {
  return (
    process.env.KCC20_MIGRATE_ATTESTOR_SECRET?.trim() ||
    process.env.KCC20_BRIDGE_WATCHER_SECRET?.trim() ||
    ''
  );
}

function watcherAuthorized(req: NextRequest): boolean {
  const expected = watcherSecretExpected();
  if (!expected) return false;
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const header =
    req.headers.get('x-krex-attestor-secret')?.trim() ||
    req.headers.get('x-krex-watcher-secret')?.trim() ||
    '';
  return bearer === expected || header === expected;
}

async function getAttestations(req: NextRequest) {
  const burn = normalizeTxHash(req.nextUrl.searchParams.get('burnTxHash'));
  const store = await loadAttestationStore();
  if (burn) {
    const row = await findAttestation(burn);
    return NextResponse.json({
      ok: true,
      mode: 'attest',
      network: store.network,
      burnTxHash: burn,
      found: Boolean(row),
      attestation: row,
      attestations: row ? [row] : [],
    });
  }
  return NextResponse.json({
    ok: true,
    mode: 'attest',
    network: store.network,
    updatedAt: store.updatedAt,
    attestations: store.attestations,
    watcherSecretConfigured: Boolean(watcherSecretExpected()),
  });
}

async function postAttestation(req: NextRequest, body: Record<string, unknown>) {
  if (!watcherSecretExpected()) {
    return NextResponse.json(
      { ok: false, error: 'Watcher/attestor secret is not configured on this deployment' },
      { status: 503 },
    );
  }
  if (!watcherAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const burnTxHash = normalizeTxHash(typeof body.burnTxHash === 'string' ? body.burnTxHash : '');
  if (!burnTxHash) {
    return NextResponse.json({ ok: false, error: 'burnTxHash must be 64-char hex' }, { status: 400 });
  }

  const existing = await findAttestation(burnTxHash);
  const statusRaw = typeof body.status === 'string' ? body.status : existing?.status || 'attested';
  const status = (['pending', 'attested', 'claimed', 'rejected'] as const).includes(
    statusRaw as MigrateAttestation['status'],
  )
    ? (statusRaw as MigrateAttestation['status'])
    : 'attested';

  if (existing?.status === 'claimed' && status !== 'claimed') {
    return NextResponse.json(
      { ok: false, error: 'Burn already claimed; nullifier active', attestation: existing },
      { status: 409 },
    );
  }

  const ticketIdRaw = typeof body.ticketId === 'string' ? body.ticketId.trim() : existing?.ticketId;
  const ticketTxId =
    typeof body.ticketTxId === 'string'
      ? body.ticketTxId.trim().toLowerCase()
      : existing?.ticketTxId;
  const ticketIndex =
    typeof body.ticketIndex === 'number'
      ? body.ticketIndex
      : typeof body.ticketIndex === 'string'
        ? Number(body.ticketIndex)
        : existing?.ticketIndex;

  // Prefer explicit outpoint fields; accept ticketId as txid:index.
  let ticketId = ticketIdRaw;
  if (ticketTxId && /^[a-f0-9]{64}$/.test(ticketTxId) && Number.isFinite(ticketIndex)) {
    ticketId = `${ticketTxId}:${Number(ticketIndex)}`;
  }

  if (
    existing?.ticketId &&
    /^[a-f0-9]{64}:\d+$/.test(existing.ticketId) &&
    ticketId &&
    ticketId !== existing.ticketId &&
    status === 'attested'
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Ticket already issued for this burn; nullifier active',
        attestation: existing,
      },
      { status: 409 },
    );
  }

  const row: MigrateAttestation = {
    network: 'testnet-10',
    tick: String(body.tick || existing?.tick || 'TKREX').trim().toUpperCase(),
    burnTxHash,
    amountRaw: String(body.amountRaw ?? existing?.amountRaw ?? '0'),
    amount: Number(body.amount ?? existing?.amount ?? 0),
    from: String(body.from || existing?.from || ''),
    sinkAddress: String(body.sinkAddress || existing?.sinkAddress || ''),
    claimantAddress:
      typeof body.claimantAddress === 'string' ? body.claimantAddress : existing?.claimantAddress,
    attestorPubkey:
      typeof body.attestorPubkey === 'string' ? body.attestorPubkey : existing?.attestorPubkey,
    attestorSigs: Array.isArray(body.attestorSigs)
      ? (body.attestorSigs as MigrateAttestation['attestorSigs'])
      : existing?.attestorSigs,
    ticketId,
    ticketTxId: ticketTxId && /^[a-f0-9]{64}$/.test(ticketTxId) ? ticketTxId : existing?.ticketTxId,
    ticketIndex: Number.isFinite(ticketIndex) ? Number(ticketIndex) : existing?.ticketIndex,
    mintTxHash:
      normalizeTxHash(typeof body.mintTxHash === 'string' ? body.mintTxHash : '') ||
      existing?.mintTxHash,
    assetCovenantId:
      typeof body.assetCovenantId === 'string' ? body.assetCovenantId : existing?.assetCovenantId,
    migrateVersion:
      typeof body.migrateVersion === 'number' ? body.migrateVersion : existing?.migrateVersion ?? 3,
    status,
    attestedAt: existing?.attestedAt || new Date().toISOString(),
    note: typeof body.note === 'string' ? body.note : existing?.note,
  };

  const { attestation, persist } = await upsertAttestation(row);
  return NextResponse.json({ ok: true, mode: 'attest', attestation, persist });
}

async function getMintTip() {
  const tip = await loadMigrateMintTip();
  return NextResponse.json({
    ok: true,
    mode: 'mint-tip',
    network: 'testnet-10',
    found: Boolean(tip),
    tip,
  });
}

async function postMintTip(req: NextRequest, body: Record<string, unknown>) {
  if (!watcherSecretExpected()) {
    return NextResponse.json(
      { ok: false, error: 'Watcher/attestor secret is not configured on this deployment' },
      { status: 503 },
    );
  }
  if (!watcherAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const tipBody =
    body.tip && typeof body.tip === 'object'
      ? (body.tip as Record<string, unknown>)
      : body;
  const persisted = await persistMigrateMintTip(tipBody);
  if (!persisted.ok || !persisted.tip) {
    return NextResponse.json(
      {
        ok: false,
        mode: 'mint-tip',
        error: persisted.error || 'Failed to persist migrate mint tip',
        via: persisted.via,
      },
      { status: persisted.error?.startsWith('Invalid') ? 400 : 502 },
    );
  }
  return NextResponse.json({
    ok: true,
    mode: 'mint-tip',
    tip: persisted.tip,
    persist: { ok: true, via: persisted.via },
  });
}

/** Public: mint receipts, migrate attestations (?mode=attest), or mint tip (?mode=mint-tip). */
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode');
  if (mode === 'attest') {
    return getAttestations(req);
  }
  if (mode === 'mint-tip') {
    return getMintTip();
  }

  const deposit = normalizeTxHash(req.nextUrl.searchParams.get('depositTxHash'));
  const store = await loadMintReceiptStore();
  if (deposit) {
    const receipt = findMintReceipt(store, deposit);
    return NextResponse.json({
      ok: true,
      network: store.network,
      tick: store.tick,
      depositTxHash: deposit,
      found: Boolean(receipt),
      receipt,
      ignored: store.ignoredDepositTxHashes.includes(deposit),
    });
  }
  return NextResponse.json({
    ok: true,
    network: store.network,
    tick: store.tick,
    updatedAt: store.updatedAt,
    receipts: store.receipts,
    ignoredDepositTxHashes: store.ignoredDepositTxHashes,
  });
}

/**
 * Watcher/attestor POST.
 * - Mint receipt: depositTxHash + mintTxHash
 * - Migrate attest: mode=attest (query or body) + burnTxHash
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const mode =
    req.nextUrl.searchParams.get('mode') ||
    (typeof body.mode === 'string' ? body.mode : '') ||
    (typeof body.burnTxHash === 'string' && !body.mintTxHash ? 'attest' : 'mint');

  if (mode === 'attest') {
    return postAttestation(req, body);
  }
  if (mode === 'mint-tip') {
    return postMintTip(req, body);
  }

  if (!watcherAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.KCC20_BRIDGE_WATCHER_SECRET?.trim()) {
    return NextResponse.json(
      { ok: false, error: 'KCC20_BRIDGE_WATCHER_SECRET is not configured' },
      { status: 503 },
    );
  }

  const depositTxHash = normalizeTxHash(
    typeof body.depositTxHash === 'string' ? body.depositTxHash : '',
  );
  const mintTxHash = normalizeTxHash(typeof body.mintTxHash === 'string' ? body.mintTxHash : '');
  if (!depositTxHash || !mintTxHash) {
    return NextResponse.json(
      { ok: false, error: 'depositTxHash and mintTxHash must be 64-char hex' },
      { status: 400 },
    );
  }

  const amountRaw =
    typeof body.amountRaw === 'string'
      ? body.amountRaw
      : typeof body.amountRaw === 'number'
        ? String(body.amountRaw)
        : '';
  const amount =
    typeof body.amount === 'number' && Number.isFinite(body.amount)
      ? body.amount
      : amountRaw
        ? Number(amountRaw) / 1e8
        : 0;

  const receipt: KrexWrapMintReceipt = {
    depositTxHash,
    mintTxHash,
    amountRaw,
    amount: Number.isFinite(amount) ? amount : 0,
    from: typeof body.from === 'string' ? body.from : undefined,
    recipientAddress: typeof body.recipientAddress === 'string' ? body.recipientAddress : undefined,
    recipientPubkey: typeof body.recipientPubkey === 'string' ? body.recipientPubkey : undefined,
    assetCovenantId: typeof body.assetCovenantId === 'string' ? body.assetCovenantId : undefined,
    mintedAt: typeof body.mintedAt === 'string' ? body.mintedAt : new Date().toISOString(),
    status: 'minted',
  };

  const store = await loadMintReceiptStore();
  const next = upsertMintReceipt(store, receipt);
  const persisted = await persistMintReceiptStore(next);
  if (!persisted.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: persisted.error || 'Failed to persist mint receipt',
        via: persisted.via,
        receipt,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    via: persisted.via,
    receipt,
    updatedAt: next.updatedAt,
  });
}
