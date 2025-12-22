import { NextRequest, NextResponse } from 'next/server';

const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud',
  'https://ipfs.io',
  'https://cloudflare-ipfs.com',
  'https://ipfs.fleek.co',
];

/**
 * Proxy route for IPFS gateway to bypass CORS
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json(
      { error: 'Missing path parameter' },
      { status: 400 }
    );
  }

  // Try each gateway until one works
  for (const gateway of IPFS_GATEWAYS) {
    try {
      // Ensure path starts with /ipfs/
      const ipfsPath = path.startsWith('/ipfs/') ? path : `/ipfs/${path}`;
      const url = `${gateway}${ipfsPath}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
        // Don't cache failed requests
        cache: 'no-store',
      });

      if (response.ok) {
        // Get content type from response
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        
        // Get the response body
        const body = await response.arrayBuffer();

        // Return with CORS headers
        return new NextResponse(body, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': contentType,
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        });
      }
    } catch (error) {
      // Try next gateway
      console.warn(`IPFS gateway ${gateway} failed for ${path}:`, error);
      continue;
    }
  }

  // All gateways failed
  return NextResponse.json(
    { error: 'Failed to fetch from IPFS gateways' },
    { status: 500 }
  );
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

