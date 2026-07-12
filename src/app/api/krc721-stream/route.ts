import { NextRequest, NextResponse } from 'next/server';
import { getKrc721IndexerBases } from '@/lib/nft/indexer-urls';
import { corsProxyHeaders } from '@/lib/api/proxyCacheHeaders';

/**
 * Proxy route for KRC721 Stream API to bypass CORS.
 * Prefer NEXT_PUBLIC_KASPAREX_API_URL /kasparex/proxy/krc721 in the browser when set.
 *
 * Usage:
 * - GET /api/krc721-stream?endpoint=/api/v1/krc721/mainnet/address/kaspa:...
 */
export async function GET(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get('endpoint');
  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
  }

  if (!endpoint.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  }

  const bases = getKrc721IndexerBases();
  let lastError = 'All KRC721 indexers failed';

  for (const base of bases) {
    try {
      const url = `${base}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Kasparex-NFT-Tools/1.0',
        },
        next: { revalidate: 120 },
        signal: AbortSignal.timeout(20000),
      });

      const text = await response.text();
      if (!response.ok) {
        lastError = `KRC721 indexer ${base} error: ${response.status} ${response.statusText}`;
        continue;
      }

      const data = text ? JSON.parse(text) : null;
      return NextResponse.json(data, {
        headers: corsProxyHeaders('nftStream', { 'X-KRC721-Indexer': base }),
      });
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown indexer error';
    }
  }

  console.error('KRC721 Stream proxy error:', lastError);
  return NextResponse.json(
    {
      error: 'Failed to fetch from KRC721 indexer',
      details: lastError,
      indexers: bases,
    },
    { status: 502 },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsProxyHeaders('nftStream'),
  });
}
