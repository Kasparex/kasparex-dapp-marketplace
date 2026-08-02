import { NextRequest, NextResponse } from 'next/server';
import { getCipherVaultTier } from '@/lib/game/cipher-vaults-config';
import { makeCipherRunSpec } from '@/lib/game/cipher-grid';
import { getCipherPlayerState, replaceCipherPlayerState } from '@/lib/game/cipher-vaults-server-store';

export const runtime = 'nodejs';

function isValidAddress(a: string): boolean {
  return /^kaspa:[a-z0-9]{60,70}$/i.test(a.trim());
}

/** Second Seal: spend one retry, reset solve timer from tier base remaining budget. */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { address?: string; runId?: string };
    const address = body.address?.trim();
    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
    }
    const runId = body.runId?.trim();
    if (!runId) return NextResponse.json({ error: 'Missing runId' }, { status: 400 });

    const state = getCipherPlayerState(address);
    const run = state.activeRun;
    if (!run || run.runId !== runId) {
      return NextResponse.json({ error: 'No active run found' }, { status: 404 });
    }
    if ((run.retriesLeft ?? 0) <= 0) {
      return NextResponse.json({ error: 'No retries left' }, { status: 409 });
    }
    const tier = getCipherVaultTier(run.tierId);
    if (!tier) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

    const now = Date.now();
    const solveMs = Math.max(60_000, (run.solveExpiresAt ?? now) - (run.startedAt ?? now));
    const nextRun = {
      ...run,
      startedAt: now,
      solveExpiresAt: now + solveMs,
      retriesLeft: (run.retriesLeft ?? 1) - 1,
    };
    const saved = replaceCipherPlayerState(address, {
      ...state,
      version: (state.version ?? 1) + 1,
      activeRun: nextRun,
    });
    const spec = makeCipherRunSpec(run.seed, run.tierId);
    return NextResponse.json({
      ok: true,
      run: saved.activeRun,
      puzzle: {
        size: spec.size,
        initial: spec.initial,
        target: spec.target,
        moveLimit: run.moveLimit ?? tier.moveLimit,
      },
    });
  } catch (e) {
    console.error('[cipher-vaults/run/retry]', e);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}
