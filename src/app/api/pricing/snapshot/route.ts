import { NextRequest, NextResponse } from 'next/server';
import { buildPricingSnapshot, normalizePricingTickers } from '@/lib/pricing/buildSnapshot';

export const revalidate = 300;

/**
 * Cached KAS-equivalent rates for Hub checkout and policy.
 * Query: ?tickers=KREX,NACHO,MYTOKEN (comma-separated, auto-fetches market prices)
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('tickers') ?? '';
  const tickers = normalizePricingTickers(raw.split(','));

  try {
    const snapshot = await buildPricingSnapshot(tickers);
    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
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
