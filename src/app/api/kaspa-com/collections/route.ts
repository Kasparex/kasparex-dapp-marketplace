import { NextRequest, NextResponse } from 'next/server';

const KASPACOM_BASE = 'https://api.kaspa.com';

/**
 * Batch collection fetch to reduce per-card requests.
 *
 * Usage:
 * - GET /api/kaspa-com/collections?tickers=KREXPRIME,PIXELKREX
 */
export async function GET(request: NextRequest) {
  const tickersParam = request.nextUrl.searchParams.get('tickers') ?? '';
  const tickers = tickersParam
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 50);

  if (tickers.length === 0) {
    return NextResponse.json({ error: 'Missing tickers' }, { status: 400 });
  }

  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      const url = `${KASPACOM_BASE}/krc721/${encodeURIComponent(ticker)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', 'User-Agent': 'Kasparex-NFT-Tools/1.0' },
        // allow upstream caching; we control edge caching below
        cache: 'default',
      });
      if (!res.ok) {
        const details = await res.text().catch(() => '');
        return { ticker, ok: false as const, status: res.status, details: details.slice(0, 300) };
      }
      const data = await res.json();
      return { ticker, ok: true as const, data };
    })
  );

  const payload: Record<string, unknown> = {};
  const errors: Record<string, { status: number; details?: string }> = {};

  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    if (r.value.ok) payload[r.value.ticker] = r.value.data;
    else errors[r.value.ticker] = { status: r.value.status, details: r.value.details };
  }

  return NextResponse.json(
    { ok: true, collections: payload, errors: Object.keys(errors).length ? errors : undefined },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Collection stats don't need to be real-time; cache a bit to reduce usage.
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

