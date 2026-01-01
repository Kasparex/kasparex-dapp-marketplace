import { NextRequest, NextResponse } from 'next/server';

const IPFS_GATEWAYS = [
  // User's custom Pinata gateway (prioritized)
  'https://apricot-bizarre-viper-692.mypinata.cloud',
  // Fallback gateways
  'https://gateway.pinata.cloud',
  'https://ipfs.io',
  'https://cloudflare-ipfs.com',
  'https://ipfs.fleek.co',
];

/**
 * Proxy route for IPFS gateway to bypass CORS
 * Supports custom Pinata gateways with authentication via PINATA_GATEWAY_TOKEN
 * Updated: Improved Hat trait normalization and Pinata gateway token support
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
      // Remove /ipfs/ prefix if present
      let cleanPath = decodedPath.replace(/^\/?ipfs\//, '');
      
      // Split path into CID and subpath
      // CID is typically the first segment (bafybe...)
      const pathParts = cleanPath.split('/');
      const cid = pathParts[0]; // First part is the CID
      const subPath = pathParts.slice(1).join('/'); // Rest is the subpath
      
      // Construct URL: gateway/ipfs/CID/subpath
      // Only encode the subpath, NOT the CID
      const encodedSubPath = subPath ? '/' + subPath.split('/').map(segment => encodeURIComponent(segment)).join('/') : '';
      const url = `${gateway}/ipfs/${cid}${encodedSubPath}`;

      console.log(`[IPFS] Trying gateway ${gateway} with CID: ${cid}, subpath: ${subPath}`);
      console.log(`[IPFS] Full URL: ${url}`);

      // Prepare headers
      const headers: HeadersInit = {
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (compatible; Kasparex/1.0)',
      };
      
      // For custom Pinata gateways, add gateway token if configured
      // Set PINATA_GATEWAY_TOKEN in your Vercel environment variables if needed
      if (gateway.includes('mypinata.cloud') && process.env.PINATA_GATEWAY_TOKEN) {
        headers['x-pinata-gateway-token'] = process.env.PINATA_GATEWAY_TOKEN;
        console.log(`[IPFS] Using Pinata gateway token for ${gateway}`);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        // Don't cache failed requests
        cache: 'no-store',
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        console.log(`[IPFS] ✅ Successfully fetched from ${gateway} for ${decodedPath}`);
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
        const errorText = await response.text().catch(() => '');
        console.warn(`[IPFS] ❌ Gateway ${gateway} returned status ${response.status} for ${url}`);
        console.warn(`[IPFS] Response preview: ${errorText.substring(0, 200)}`);
        // Log the full URL for debugging
        console.warn(`[IPFS] Failed URL: ${url}`);
      }
    } catch (error) {
      // Try next gateway
      console.warn(`[IPFS] ❌ Gateway ${gateway} threw error for ${decodedPath}:`, error);
      if (error instanceof Error) {
        console.warn(`[IPFS] Error message: ${error.message}`);
        console.warn(`[IPFS] Error stack: ${error.stack?.substring(0, 300)}`);
      }
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

