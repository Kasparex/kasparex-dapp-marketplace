import { NextRequest, NextResponse } from 'next/server';
import { CIPHER_VAULT_TIERS } from '@/lib/game/cipher-vaults-config';
import { makeCipherRunSpec } from '@/lib/game/cipher-grid';
import { getCipherPlayerState } from '@/lib/game/cipher-vaults-server-store';

export const runtime = 'nodejs';

function isValidAddress(a: string): boolean {
  return /^kaspa:[a-z0-9]{60,70}$/i.test(a.trim());
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
  }
  const state = getCipherPlayerState(address);
  const run = state.activeRun;
  if (!run) {
    return NextResponse.json({ ok: true, run: null });
  }
  const tier = CIPHER_VAULT_TIERS.find((t) => t.id === run.tierId);
  if (!tier) {
    return NextResponse.json({ ok: true, run: null });
  }
  const spec = makeCipherRunSpec(run.seed, run.tierId);
  return NextResponse.json({
    ok: true,
    run,
    puzzle: { size: spec.size, initial: spec.initial, target: spec.target, moveLimit: tier.moveLimit },
  });
}

