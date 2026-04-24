import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function isValidAddress(a: string): boolean {
  return /^kaspa:[a-z0-9]{60,70}$/i.test(a.trim());
}

/** Placeholder until Minecore server-side player state mirrors Diamond Veins. */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
  }
  return NextResponse.json({
    entries: [] as const,
    refinementPointsTotal: 0,
    note: 'Minecore ledger sync is not enabled on the server yet; the game UI uses your device checkpoint list.',
  });
}
