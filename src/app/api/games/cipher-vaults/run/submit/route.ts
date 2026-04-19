import { NextRequest, NextResponse } from 'next/server';
import { CIPHER_VAULT_TIERS } from '@/lib/game/cipher-vaults-config';
import type { CipherMove } from '@/lib/game/cipher-grid';
import { applyCipherMoves, isSolved, makeCipherRunSpec } from '@/lib/game/cipher-grid';
import { getCipherPlayerState, replaceCipherPlayerState } from '@/lib/game/cipher-vaults-server-store';

export const runtime = 'nodejs';

function isValidAddress(a: string): boolean {
  return /^kaspa:[a-z0-9]{60,70}$/i.test(a.trim());
}

function isMoves(x: unknown): x is CipherMove[] {
  return Array.isArray(x) && x.length <= 64;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { address?: string; runId?: string; moves?: unknown };
    const address = body.address?.trim();
    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
    }
    const runId = body.runId?.trim();
    if (!runId) return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
    if (!isMoves(body.moves)) return NextResponse.json({ error: 'Missing or invalid moves' }, { status: 400 });

    const state = getCipherPlayerState(address);
    const run = state.activeRun;
    if (!run || run.runId !== runId) {
      return NextResponse.json({ error: 'No active run found' }, { status: 404 });
    }
    const tier = CIPHER_VAULT_TIERS.find((t) => t.id === run.tierId);
    if (!tier) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    if (body.moves.length > tier.moveLimit) {
      return NextResponse.json({ error: 'Move limit exceeded' }, { status: 409 });
    }

    const spec = makeCipherRunSpec(run.seed, run.tierId);
    const finalGrid = applyCipherMoves(spec.initial, spec.size, body.moves);
    const solved = isSolved(finalGrid, spec.target);
    if (!solved) {
      return NextResponse.json({ ok: false, solved: false }, { status: 200 });
    }

    const entry = {
      id: `${runId}:${Date.now()}`,
      runId,
      tierId: run.tierId,
      solvedAt: Date.now(),
      moves: body.moves.length,
      moveLimit: tier.moveLimit,
      entryTxHash: run.entryTxHash,
    };

    const next = {
      ...state,
      version: (state.version ?? 1) + 1,
      activeRun: null,
      ledger: [...(state.ledger ?? []), entry],
    };
    const saved = replaceCipherPlayerState(address, next);
    return NextResponse.json({ ok: true, solved: true, state: saved, entry });
  } catch (e) {
    console.error('[cipher-vaults/run/submit]', e);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}

