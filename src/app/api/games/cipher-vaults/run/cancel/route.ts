import { NextRequest, NextResponse } from 'next/server';
import { getCipherPlayerState, replaceCipherPlayerState } from '@/lib/game/cipher-vaults-server-store';

export const runtime = 'nodejs';

function isValidAddress(a: string): boolean {
  return /^kaspa:[a-z0-9]{60,70}$/i.test(a.trim());
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { address?: string; runId?: string };
    const address = body.address?.trim();
    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
    }
    const state = getCipherPlayerState(address);
    if (!state.activeRun) {
      return NextResponse.json({ ok: true, state });
    }
    if (body.runId && state.activeRun.runId !== body.runId) {
      return NextResponse.json({ error: 'Run id mismatch' }, { status: 409 });
    }
    const next = { ...state, version: (state.version ?? 1) + 1, activeRun: null };
    const saved = replaceCipherPlayerState(address, next);
    return NextResponse.json({ ok: true, state: saved });
  } catch (e) {
    console.error('[cipher-vaults/run/cancel]', e);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}

