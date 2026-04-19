import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { CIPHER_VAULT_TIERS, type CipherVaultTierId } from '@/lib/game/cipher-vaults-config';
import { makeCipherRunSpec } from '@/lib/game/cipher-grid';
import { getCipherPlayerState, replaceCipherPlayerState } from '@/lib/game/cipher-vaults-server-store';
import { CIPHER_TICKET_REDEEM_RATE_POINTS } from '@/lib/game/cipher-vaults-config';

export const runtime = 'nodejs';

function isValidAddress(a: string): boolean {
  return /^kaspa:[a-z0-9]{60,70}$/i.test(a.trim());
}

function isTierId(x: string): x is CipherVaultTierId {
  return (CIPHER_VAULT_TIERS as readonly { id: string }[]).some((t) => t.id === x);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      address?: string;
      tierId?: string;
      paidBy?: 'KAS' | 'TICKET';
      entryTxHash?: string;
    };
    const address = body.address?.trim();
    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
    }
    const tierId = body.tierId?.trim();
    if (!tierId || !isTierId(tierId)) {
      return NextResponse.json({ error: 'Missing or invalid tierId' }, { status: 400 });
    }
    const paidBy: 'KAS' | 'TICKET' = body.paidBy === 'TICKET' ? 'TICKET' : 'KAS';
    const entryTxHash = typeof body.entryTxHash === 'string' ? body.entryTxHash.trim() : undefined;
    const runId = randomUUID();
    const seed = randomUUID().replace(/-/g, '');

    const state = getCipherPlayerState(address);
    const tier = CIPHER_VAULT_TIERS.find((t) => t.id === tierId)!;
    const ticketsTotal = Math.floor((state.redeemedRefinementPointsTotal ?? 0) / CIPHER_TICKET_REDEEM_RATE_POINTS);
    const ticketsAvailable = Math.max(0, ticketsTotal - (state.ticketsSpent ?? 0));
    if (paidBy === 'TICKET') {
      if (ticketsAvailable <= 0) {
        return NextResponse.json({ error: 'No tickets available' }, { status: 409 });
      }
    }

    const next = {
      ...state,
      version: (state.version ?? 1) + 1,
      ticketsSpent: paidBy === 'TICKET' ? (state.ticketsSpent ?? 0) + 1 : state.ticketsSpent ?? 0,
      activeRun: {
        runId,
        tierId,
        seed,
        startedAt: Date.now(),
        paidBy,
        entryTxHash: paidBy === 'KAS' ? entryTxHash : undefined,
      },
    };
    const saved = replaceCipherPlayerState(address, next);

    const spec = makeCipherRunSpec(seed, tierId);
    return NextResponse.json({
      ok: true,
      state: saved,
      run: saved.activeRun,
      puzzle: { size: spec.size, initial: spec.initial, target: spec.target, moveLimit: tier.moveLimit },
    });
  } catch (e) {
    console.error('[cipher-vaults/run/start]', e);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}

