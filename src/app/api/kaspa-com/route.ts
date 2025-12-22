import { NextRequest, NextResponse } from 'next/server';

const KASPACOM_API_BASE = 'https://api.kaspa.com/api';
const KASPACOM_BASE = 'https://api.kaspa.com';

/**
 * Proxy route for KaspaCom API to bypass CORS
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint');
  const refresh = searchParams.get('refresh');

  if (!endpoint) {
    return NextResponse.json(
      { error: 'Missing endpoint parameter' },
      { status: 400 }
    );
  }

  try {
    // Build the URL - handle both /api/krc721 and /krc721 endpoints
    let url: string;
    if (endpoint.startsWith('/api/')) {
      // Endpoint already includes /api/, use API_BASE
      url = `${KASPACOM_API_BASE}${endpoint.replace('/api', '')}`;
    } else if (endpoint.startsWith('/krc721/')) {
      // Direct krc721 endpoint, use BASE
      url = `${KASPACOM_BASE}${endpoint}`;
    } else {
      // Default to API_BASE
      url = `${KASPACOM_API_BASE}${endpoint}`;
    }
    if (refresh === 'true') {
      url += url.includes('?') ? '&refresh=true' : '?refresh=true';
    }

    // Make the request to KaspaCom API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Kasparex-NFT-Tools/1.0',
      },
      // Add cache control for better performance
      cache: refresh === 'true' ? 'no-store' : 'default',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: `KaspaCom API error: ${response.status} ${response.statusText}`, details: errorText },
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
        'Cache-Control': refresh === 'true' ? 'no-store' : 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('KaspaCom API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from KaspaCom API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Handle POST requests for filtering tokens
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json(
      { error: 'Missing endpoint parameter' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    // Build the URL - handle both /api/krc721 and /krc721 endpoints
    let url: string;
    if (endpoint.startsWith('/api/')) {
      url = `${KASPACOM_API_BASE}${endpoint.replace('/api', '')}`;
    } else if (endpoint.startsWith('/krc721/')) {
      url = `${KASPACOM_BASE}${endpoint}`;
    } else {
      url = `${KASPACOM_API_BASE}${endpoint}`;
    }

    // Make the request to KaspaCom API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Kasparex-NFT-Tools/1.0',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: `KaspaCom API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('KaspaCom API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from KaspaCom API', details: error instanceof Error ? error.message : 'Unknown error' },
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

