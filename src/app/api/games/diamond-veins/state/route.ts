import { NextRequest, NextResponse } from 'next/server';
import type { TyconGameState } from '@/lib/game/engine';
import { applyEvents, hydrateTyconState } from '@/lib/game/engine';
import { getPlayerState, replacePlayerState } from '@/lib/game/diamond-veins-server-store';
import { computeAutoRestartMiningRunEvents } from '@/lib/game/diamond-veins-automation';

export const runtime = 'nodejs';

function isValidAddress(a: string): boolean {
  return /^kaspa:[a-z0-9]{60,70}$/i.test(a.trim());
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
  }
  const state = getPlayerState(address);
  return NextResponse.json({ state, found: state != null });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      address?: string;
      state?: TyconGameState;
    };
    const address = body.address?.trim();
    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
    }
    if (!body.state || typeof body.state !== 'object') {
      return NextResponse.json({ error: 'Missing state snapshot' }, { status: 400 });
    }
    let s = hydrateTyconState(body.state as TyconGameState);
    const auto = computeAutoRestartMiningRunEvents(s, Date.now());
    if (auto.length) {
      s = applyEvents(s, auto);
    }
    const saved = replacePlayerState(address, s);
    return NextResponse.json({ state: saved, ok: true, appliedAutoEvents: auto.length > 0 });
  } catch (e) {
    console.error('[diamond-veins/state]', e);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}
