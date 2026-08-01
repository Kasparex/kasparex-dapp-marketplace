import { NextRequest, NextResponse } from 'next/server';
import { buildPricingSnapshot, normalizePricingTickers } from '@/lib/pricing/buildSnapshot';

export const revalidate = 900;

/**
 * Cached KAS-equivalent rates for Hub checkout and Pay with.
 * Query: ?tickers=KREX,NACHO,MYTOKEN (comma-separated).
 * Primary source: KasLab `price_kas` (same as kaspatoken.kaslab.space converters).
 * Fallback: api.kaspa.com, then Minecore peg for KREX only.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('tickers') ?? '';
  const tickers = normalizePricingTickers(raw.split(','));

  try {
    const snapshot = await buildPricingSnapshot(tickers);
    return NextResponse.json(snapshot, {
      headers: {
        // Keep FX near public converters; still edge-cached to avoid fetch storms.
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
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
