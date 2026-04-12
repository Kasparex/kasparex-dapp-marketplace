/**
 * Kasparex API Cloudflare Worker
 * 
 * Main router for Kasparex API endpoints
 * 
 * Deploy: wrangler deploy
 */

import { applyMiddleware, getCorsHeaders } from './middleware';
import { handleNodeRequest } from './kasparex-api/nodes';
import { handleRewardRequest } from './kasparex-api/rewards';
import { handleL1RewardRequest } from './kasparex-api/rewards-l1';
import { handlePublicRequest } from './kasparex-api/public';
import { handleProcessRewards, processPendingRewards } from './kasparex-api/reward-processor';
import { handleArchiveRewards, handleManualArchive } from './kasparex-api/archive';
export interface Env {
  // KV Namespace for caching
  KASPAREX_CACHE: KVNamespace;
  
  // D1 Database for dynamic data
  NODES_DB: D1Database;
  REWARDS_DB: D1Database; // Separate database for rewards
  
  // Rate limiting KV (optional)
  RATE_LIMIT?: KVNamespace;
  
  // Environment variables
  REGISTRY_CID?: string;
  PINATA_API_KEY?: string;
  STORACHA_API_KEY?: string;
  KASPAREX_API_URL?: string;
  ARCHIVE_AUTH_TOKEN?: string; // For manual archive endpoint
  IGRA_RPC_URL?: string; // Igra testnet RPC URL for event indexing
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle scheduled events (cron triggers)
    if (request.headers.get('cf-scheduled') === 'true') {
      const event = {
        scheduledTime: Date.now(),
        cron: request.headers.get('cf-cron') || 'unknown',
      } as ScheduledEvent;
      
      const cron = event.cron;
      
      // Process rewards every 15 minutes
      if (cron === '*/15 * * * *' || cron === '0,15,30,45 * * * *') {
        console.log('[Cron] Processing pending rewards...');
        await processPendingRewards(env, 50);
      }
      
      // Archive rewards daily at 2 AM UTC
      if (cron === '0 2 * * *') {
        console.log('[Cron] Archiving old rewards...');
        await handleArchiveRewards(event, env);
      }
      
      return new Response('OK');
    }
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // Apply middleware (CORS, rate limiting)
      const middlewareResponse = await applyMiddleware(request, env);
      if (middlewareResponse) {
        return middlewareResponse;
      }

      // Route Kasparex API endpoints
      if (pathname.startsWith('/kasparex/node/') || pathname.startsWith('/kasparex/nodes')) {
        return handleNodeRequest(request, env);
      }

      if (pathname.startsWith('/kasparex/rewards/')) {
        // L1 rewards (dApp user rewards)
        if (pathname.startsWith('/kasparex/rewards/l1/')) {
          // Manual reward processing endpoint
          if (pathname === '/kasparex/rewards/l1/process' && request.method === 'POST') {
            return handleProcessRewards(request, env);
          }
          return handleL1RewardRequest(request, env);
        }
        // Node rewards (KREX node operator rewards)
        return handleRewardRequest(request, env);
      }

      if (pathname.startsWith('/kasparex/stats') || pathname.startsWith('/kasparex/dapps/availability')) {
        return handlePublicRequest(request, env);
      }

      // Manual archive endpoint (for testing)
      if (pathname === '/kasparex/rewards/archive' && request.method === 'POST') {
        return handleManualArchive(request, env);
      }

      // Health check
      if (pathname === '/health' || pathname === '/') {
        return new Response(
          JSON.stringify({ 
            status: 'ok', 
            timestamp: Date.now(),
            service: 'Kasparex API',
            version: '1.0.0'
          }),
          {
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { 
          status: 404,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
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

/**
 * Handle node-related endpoints (dynamic data)
 */
async function handleNodeEndpoint(
  pathname: string,
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Example: GET /api/node/ping
  // This would interact with D1 database
  // For now, return a placeholder
  
  if (pathname === '/api/node/ping' && request.method === 'POST') {
    const body = await request.json();
    // Store ping in D1 database
    // await env.NODES_DB.prepare('INSERT INTO node_pings ...').run(...);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response('Not found', {
    status: 404,
    headers: corsHeaders,
  });
}

/**
 * Handle reward-related endpoints
 */
async function handleRewardEndpoint(
  pathname: string,
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Example: GET /api/rewards/:nodeId
  // Calculate and return rewards from D1 database
  
  return new Response(JSON.stringify({ rewards: [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Handle stats endpoint
 */
async function handleStatsEndpoint(
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Aggregate stats from D1 database
  // For now, return placeholder
  
  return new Response(
    JSON.stringify({
      totalNodes: 0,
      totalDApps: 0,
      totalRequests: 0,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}















