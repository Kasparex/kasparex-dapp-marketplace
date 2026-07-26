import { NextRequest, NextResponse } from 'next/server';
import { corsProxyHeaders } from '@/lib/api/proxyCacheHeaders';
import { kcc20InfoBase } from '@/lib/programmable/config';

/**
 * Proxy for kcc20.info (Kaspa Covenant Indexer API) to bypass missing CORS.
 * Only GET paths under /v1/ or /health are allowed.
 */
export async function GET(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get('endpoint');
  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
  }

  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!/^\/(health|v1\/)/.test(normalized) || normalized.includes('://') || normalized.includes('..')) {
    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  }

  const profile = /\/balances|\/holders|\/owners\//.test(normalized) ? 'indexerBalance' : 'indexerMeta';

  try {
    const url = `${kcc20InfoBase()}${normalized}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Kasparex-KCC20-Lookup/1.0',
      },
      next: { revalidate: profile === 'indexerBalance' ? 60 : 300 },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        {
          error: `kcc20.info error: ${response.status} ${response.statusText}`,
          details: errorText.substring(0, 500),
        },
        { status: response.status, headers: corsProxyHeaders(profile) },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: corsProxyHeaders(profile) });
  } catch (error) {
    console.error('kcc20.info proxy error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch from kcc20.info',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsProxyHeaders(profile) },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsProxyHeaders('indexerMeta'),
  });
}
