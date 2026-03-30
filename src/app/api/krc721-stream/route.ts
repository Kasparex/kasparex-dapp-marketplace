import { NextRequest, NextResponse } from 'next/server';

const KRC721_STREAM_BASE = 'https://mainnet.krc721.stream';

/**
 * Proxy route for KRC721 Stream API to bypass CORS.
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

  try {
    const url = `${KRC721_STREAM_BASE}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Kasparex-NFT-Tools/1.0',
      },
      cache: 'no-store',
    });

    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        { error: `KRC721 Stream API error: ${response.status} ${response.statusText}`, details: text },
        { status: response.status }
      );
    }

    // response is JSON, but we already read text for better error reporting
    const data = text ? JSON.parse(text) : null;
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('KRC721 Stream proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from KRC721 Stream API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
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

