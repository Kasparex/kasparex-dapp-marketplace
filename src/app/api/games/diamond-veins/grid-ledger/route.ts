import { NextRequest, NextResponse } from 'next/server';
import { getPlayerState } from '@/lib/game/diamond-veins-server-store';

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
  const entries = state?.gridLedger ?? [];
  return NextResponse.json({
    entries,
    refinementPointsTotal: state?.refinementPointsTotal ?? 0,
    note: 'GRID distribution uses RewardManager / FeeRouter on Kasplex L2; ledger entries are refine checkpoints for your wallet.',
  });
}
