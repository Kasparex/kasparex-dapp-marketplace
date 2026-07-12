import { NextRequest, NextResponse } from 'next/server';
import { corsProxyHeaders, kasplexCacheProfile } from '@/lib/api/proxyCacheHeaders';

const KASPLEX_INDEXER_API_BASE = 'https://api.kasplex.org';

/**
 * Proxy route for Kasplex Indexer API to bypass CORS.
 * Prefer NEXT_PUBLIC_KASPAREX_API_URL /kasparex/proxy/kasplex in the browser when set.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json(
      { error: 'Missing endpoint parameter' },
      { status: 400 }
    );
  }

  const profile = kasplexCacheProfile(endpoint);

  try {
    const url = `${KASPLEX_INDEXER_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Kasparex-KREX-Balance/1.0',
      },
      next: { revalidate: profile === 'indexerBalance' ? 60 : 300 },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Kasplex Indexer Proxy] API returned ${response.status}:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500),
      });
      return NextResponse.json(
        { error: `Kasplex Indexer API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: corsProxyHeaders(profile),
    });
  } catch (error) {
    console.error('Kasplex Indexer API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Kasplex Indexer API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsProxyHeaders('indexerBalance'),
  });
}
