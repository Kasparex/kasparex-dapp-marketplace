import { NextRequest, NextResponse } from 'next/server';
import { buildPricingSnapshot, normalizePricingTickers } from '@/lib/pricing/buildSnapshot';

export const revalidate = 3600;

/**
 * Cached KAS-equivalent rates for Hub checkout and Pay with.
 * Query: ?tickers=KREX,NACHO,MYTOKEN (comma-separated).
 * All KRC-20 ticks (including KREX) use market rates; KREX falls back to Minecore peg if market is missing.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('tickers') ?? '';
  const tickers = normalizePricingTickers(raw.split(','));

  try {
    const snapshot = await buildPricingSnapshot(tickers);
    return NextResponse.json(snapshot, {
      headers: {
        // Aggressive edge cache to cut FX fetch cost / spikes.
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[pricing/snapshot]', error);
    return NextResponse.json(
      { error: 'Failed to build pricing snapshot' },
      { status: 500 },
    );
  }
}
