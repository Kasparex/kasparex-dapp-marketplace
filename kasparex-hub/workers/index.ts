/**
 * Kasparex API Cloudflare Worker
 * 
 * Main entry point for all API routes
 * Handles routing to Kasparex API endpoints and other API routes
 */

export interface Env {
  // KV Namespace for caching
  KASPAREX_CACHE: KVNamespace;
  
  // D1 Database for dynamic data
  NODES_DB: D1Database;
  
  // R2 Bucket for asset storage
  ASSETS_BUCKET: R2Bucket;
  
  // Environment variables
  REGISTRY_CID: string;
  PINATA_API_KEY?: string;
  STORACHA_API_KEY?: string;
  KASPAREX_API_URL?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route to Kasparex API endpoints
      if (pathname.startsWith('/kasparex/')) {
        // Import and use Kasparex API handlers
        const { handleKasparexRequest } = await import('./kasparex-api/index');
        return handleKasparexRequest(request, env, corsHeaders);
      }

      // Static data endpoints → IPFS with KV cache
      if (pathname === '/api/dapps' || pathname.startsWith('/api/dapps/')) {
        return handleStaticEndpoint(pathname, env, corsHeaders);
      }

      if (pathname === '/api/tokens' || pathname.startsWith('/api/tokens/')) {
        return handleStaticEndpoint(pathname, env, corsHeaders);
      }

      if (pathname === '/api/contracts' || pathname.startsWith('/api/contracts/')) {
        return handleStaticEndpoint(pathname, env, corsHeaders);
      }

      // Health check
      if (pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not found', { 
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

/**
 * Handle static data endpoints (dApps, tokens, contracts)
 * Fetches from IPFS with KV caching
 */
async function handleStaticEndpoint(
  pathname: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Check KV cache first
  const cacheKey = `cache:${pathname}`;
  const cached = await env.KASPAREX_CACHE.get(cacheKey, { type: 'json' });

  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'HIT',
      },
    });
  }

  // Fetch from IPFS
  const cid = env.REGISTRY_CID;
  if (!cid) {
    return new Response(
      JSON.stringify({ error: 'Registry CID not configured' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Try Pinata gateway first (if API key available)
  const gateways = [
    env.PINATA_API_KEY 
      ? `https://gateway.pinata.cloud/ipfs/${cid}`
      : null,
    `https://storacha.network/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
  ].filter(Boolean) as string[];

  let data = null;
  for (const gateway of gateways) {
    try {
      const response = await fetch(gateway, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        data = await response.json();
        break;
      }
    } catch (error) {
      console.warn(`Gateway ${gateway} failed:`, error);
      continue;
    }
  }

  if (!data) {
    return new Response(
      JSON.stringify({ error: 'Registry not available from any gateway' }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Cache for 1 hour
  await env.KASPAREX_CACHE.put(cacheKey, JSON.stringify(data), {
    expirationTtl: 3600,
  });

  return new Response(JSON.stringify(data), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'X-Cache': 'MISS',
    },
  });
}



