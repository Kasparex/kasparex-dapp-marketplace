import { NextRequest, NextResponse } from 'next/server';
import { DIAMOND_VEINS_GARAGE_ADDRESS } from '@/lib/game/diamond-veins-config';

/**
 * Legacy GET placeholder for indexer-backed KREX transfer verification.
 * Garage purchases should register via POST /api/games/diamond-veins/receipt with a client state snapshot + txHash.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const txHash = searchParams.get('txHash');

  if (!txHash) {
    return NextResponse.json({ error: 'Missing txHash' }, { status: 400 });
  }

  return NextResponse.json({
    verified: false,
    message: 'Use POST /api/games/diamond-veins/receipt with { address, state, receiptId, txHash, boost } for idempotent registration.',
    garageAddress: DIAMOND_VEINS_GARAGE_ADDRESS,
    txHash,
  });
}
