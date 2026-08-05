import { NextRequest, NextResponse } from 'next/server';
import {
  findMintReceipt,
  normalizeTxHash,
  upsertMintReceipt,
  type KrexWrapMintReceipt,
} from '@/lib/krex/wrap/mintReceipts';
import { loadMintReceiptStore, persistMintReceiptStore } from '@/lib/krex/wrap/mintReceiptStore';

export const runtime = 'nodejs';

function watcherAuthorized(req: NextRequest): boolean {
  const expected = process.env.KCC20_BRIDGE_WATCHER_SECRET?.trim();
  if (!expected) return false;
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const header = req.headers.get('x-krex-watcher-secret')?.trim() || '';
  return bearer === expected || header === expected;
}

/** Public: list receipts or look up one deposit. */
export async function GET(req: NextRequest) {
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
 * Watcher-only: record a completed mint so Hub History can flip to Minted.
 * Authorization: Bearer KCC20_BRIDGE_WATCHER_SECRET (or x-krex-watcher-secret).
 */
export async function POST(req: NextRequest) {
  if (!watcherAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.KCC20_BRIDGE_WATCHER_SECRET?.trim()) {
    return NextResponse.json(
      { ok: false, error: 'KCC20_BRIDGE_WATCHER_SECRET is not configured' },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
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
