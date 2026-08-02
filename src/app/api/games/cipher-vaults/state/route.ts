import { NextRequest, NextResponse } from 'next/server';
import type { CipherVaultsState } from '@/lib/game/cipher-vaults-types';
import { createInitialCipherVaultsState } from '@/lib/game/cipher-vaults-types';
import { getCipherPlayerState, replaceCipherPlayerState } from '@/lib/game/cipher-vaults-server-store';

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
    return NextResponse.json({ state, found: true });
  } catch (e) {
    console.error('[cipher-vaults/state GET]', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { address?: string; state?: CipherVaultsState };
    const address = body.address?.trim();
    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
    }
    const incoming = body.state && typeof body.state === 'object' ? body.state : createInitialCipherVaultsState(address);
    const server = getCipherPlayerState(address);
    // Active runs are created/cleared only via /api/games/cipher-vaults/run/* routes.
    const merged: CipherVaultsState = {
      ...createInitialCipherVaultsState(address),
      ...incoming,
      walletAddress: address,
      activeRun: server.activeRun ?? null,
      version: Math.max(server.version ?? 0, incoming.version ?? 0) + 1,
      updatedAt: Date.now(),
    };
    const saved = replaceCipherPlayerState(address, merged);
    return NextResponse.json({ state: saved });
  } catch (e) {
    console.error('[cipher-vaults/state]', e);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}
