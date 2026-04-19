import { NextRequest, NextResponse } from 'next/server';
import type { ActiveBoost, TyconGameState } from '@/lib/game/engine';
import { applyEvents, hydrateTyconState } from '@/lib/game/engine';
import { replacePlayerState } from '@/lib/game/diamond-veins-server-store';

export const runtime = 'nodejs';

function isValidAddress(a: string): boolean {
  return /^kaspa:[a-z0-9]{60,70}$/i.test(a.trim());
}

function isValidTxHash(h: string): boolean {
  const x = h.trim();
  return x.length >= 16 && x.length <= 128;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      address?: string;
      state?: TyconGameState;
      receiptId?: string;
      txHash?: string;
      currency?: string;
      amount?: number;
      itemId?: string;
      boost?: ActiveBoost;
    };
    const address = body.address?.trim();
    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
    }
    if (!body.state || typeof body.state !== 'object') {
      return NextResponse.json({ error: 'Missing state snapshot' }, { status: 400 });
    }
    const receiptId = body.receiptId?.trim();
    const txHash = body.txHash?.trim();
    if (!receiptId || !txHash || !isValidTxHash(txHash)) {
      return NextResponse.json({ error: 'Missing receiptId or invalid txHash' }, { status: 400 });
    }
    if (!body.boost || typeof body.boost !== 'object') {
      return NextResponse.json({ error: 'Missing boost payload' }, { status: 400 });
    }

    const base = hydrateTyconState(body.state as TyconGameState);
    if (base.appliedReceiptIds.includes(receiptId)) {
      return NextResponse.json({ error: 'Receipt already applied', state: base }, { status: 409 });
    }

    const next = applyEvents(base, [
      { type: 'RegisterReceipt', receiptId, at: Date.now() },
      { type: 'AddBoost', boost: body.boost },
    ]);
    const saved = replacePlayerState(address, next);
    return NextResponse.json({ state: saved, ok: true });
  } catch (e) {
    console.error('[diamond-veins/receipt]', e);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}
