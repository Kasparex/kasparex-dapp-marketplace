import { NextRequest, NextResponse } from 'next/server';

const KASPLEX_INDEXER_API_BASE = 'https://api.kasplex.org';

/**
 * Proxy route for Kasplex Indexer API to bypass CORS
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

  try {
    // Build the URL
    const url = `${KASPLEX_INDEXER_API_BASE}${endpoint}`;

    // Make the request to Kasplex Indexer API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Kasparex-KREX-Balance/1.0',
      },
      cache: 'default',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Kasplex Indexer Proxy] API returned ${response.status}:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500), // Limit log size
      });
      return NextResponse.json(
        { error: `Kasplex Indexer API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Kasplex Indexer API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Kasplex Indexer API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS for CORS preflight
 */
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
