import { NextRequest, NextResponse } from 'next/server';
import type { MigrateAttestation } from '@/lib/krex/wrap/migrateV2';
import {
  findAttestation,
  loadAttestationStore,
  upsertAttestation,
} from '@/lib/krex/wrap/attestationStore';

export const runtime = 'nodejs';

function watcherAuthorized(req: NextRequest): boolean {
  const expected =
    process.env.KCC20_MIGRATE_ATTESTOR_SECRET?.trim() ||
    process.env.KCC20_BRIDGE_WATCHER_SECRET?.trim();
  if (!expected) return false;
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const header =
    req.headers.get('x-krex-attestor-secret')?.trim() ||
    req.headers.get('x-krex-watcher-secret')?.trim() ||
    '';
  return bearer === expected || header === expected;
}

function normalizeTx(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(v) ? v : null;
}

/** Public: list migrate burn attestations or look up one burn. */
export async function GET(req: NextRequest) {
  const burn = normalizeTx(req.nextUrl.searchParams.get('burnTxHash') || '');
  const store = await loadAttestationStore();
  if (burn) {
    const row = await findAttestation(burn);
    return NextResponse.json({
      ok: true,
      network: store.network,
      burnTxHash: burn,
      found: Boolean(row),
      attestation: row,
    });
  }
  return NextResponse.json({
    ok: true,
    network: store.network,
    updatedAt: store.updatedAt,
    attestations: store.attestations,
  });
}

/**
 * Attestor-only: record burn attestation / claim progress.
 * Auth: Bearer KCC20_MIGRATE_ATTESTOR_SECRET (falls back to KCC20_BRIDGE_WATCHER_SECRET).
 */
export async function POST(req: NextRequest) {
  if (!watcherAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const burnTxHash = normalizeTx(typeof body.burnTxHash === 'string' ? body.burnTxHash : '');
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

  // Nullifier: once claimed, never reopen for a second mint.
  if (existing?.status === 'claimed' && status !== 'claimed') {
    return NextResponse.json(
      { ok: false, error: 'Burn already claimed; nullifier active', attestation: existing },
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
    ticketId: typeof body.ticketId === 'string' ? body.ticketId : existing?.ticketId,
    mintTxHash:
      normalizeTx(typeof body.mintTxHash === 'string' ? body.mintTxHash : '') || existing?.mintTxHash,
    assetCovenantId:
      typeof body.assetCovenantId === 'string' ? body.assetCovenantId : existing?.assetCovenantId,
    status,
    attestedAt: existing?.attestedAt || new Date().toISOString(),
    note: typeof body.note === 'string' ? body.note : existing?.note,
  };

  const { attestation, persist } = await upsertAttestation(row);
  return NextResponse.json({ ok: true, attestation, persist });
}
