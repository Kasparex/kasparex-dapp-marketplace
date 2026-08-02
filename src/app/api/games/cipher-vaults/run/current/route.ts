import { NextRequest, NextResponse } from 'next/server';
import { getCipherVaultTier } from '@/lib/game/cipher-vaults-config';
import { makeCipherRunSpec } from '@/lib/game/cipher-grid';
import { getCipherPlayerState } from '@/lib/game/cipher-vaults-server-store';

export const runtime = 'nodejs';

function isValidAddress(a: string): boolean {
  return /^kaspa:[a-z0-9]{60,70}$/i.test(a.trim());
}

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get('address')?.trim() ?? '';
    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
    }
    const state = getCipherPlayerState(address);
    const run = state.activeRun;
    if (!run) {
      return NextResponse.json({ ok: true, run: null, state });
    }
    const now = Date.now();
    if ((run.solveExpiresAt ?? 0) > 0 && now > run.solveExpiresAt && (run.retriesLeft ?? 0) <= 0) {
      return NextResponse.json({ ok: true, run: null, expired: true, state });
    }
    const tier = getCipherVaultTier(run.tierId);
    const spec = makeCipherRunSpec(run.seed, run.tierId);
    return NextResponse.json({
      ok: true,
      run,
      state,
      puzzle: {
        size: spec.size,
        initial: spec.initial,
        target: spec.target,
        moveLimit: run.moveLimit ?? tier?.moveLimit ?? 20,
      },
    });
  } catch (e) {
    console.error('[cipher-vaults/run/current]', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
