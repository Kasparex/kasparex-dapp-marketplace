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

  // Decode the path parameter (it comes URL encoded)
  const decodedPath = decodeURIComponent(path);
  
  // Try each gateway until one works
  for (const gateway of IPFS_GATEWAYS) {
    try {
      // Ensure path starts with /ipfs/
      const ipfsPath = decodedPath.startsWith('/ipfs/') ? decodedPath : `/ipfs/${decodedPath}`;
      // URL encode the full path for the gateway request
      // Split by / and encode each segment separately to preserve structure
      const pathSegments = ipfsPath.split('/').filter(Boolean);
      const encodedPath = '/' + pathSegments.map(segment => encodeURIComponent(segment)).join('/');
      const url = `${gateway}${encodedPath}`;

      console.log(`[IPFS] Trying gateway ${gateway} with path: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
        // Don't cache failed requests
        cache: 'no-store',
      });

      if (response.ok) {
        console.log(`[IPFS] Successfully fetched from ${gateway}`);
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
      } else {
        console.warn(`[IPFS] Gateway ${gateway} returned status ${response.status} for ${url}`);
      }
    } catch (error) {
      // Try next gateway
      console.warn(`[IPFS] Gateway ${gateway} failed for ${decodedPath}:`, error);
      continue;
    }
  }

  // All gateways failed
  console.error(`[IPFS] All gateways failed for path: ${decodedPath}`);
  return NextResponse.json(
    { error: 'Failed to fetch from IPFS gateways', path: decodedPath },
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

