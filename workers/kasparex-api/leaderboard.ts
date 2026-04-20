/**
 * Kasparex API - Leaderboard public endpoints (node-cacheable)
 *
 * These endpoints are designed to be served by Mirror/Light nodes first.
 * They should be read-only, cacheable, and safe to replicate.
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';

type Top100Response = {
  ok?: boolean;
  snapshot?: unknown;
  seasonMeta?: unknown;
  error?: string;
};

function cacheKeyTop100(season: string) {
  return `leaderboard:top100:${season}`;
}

function cacheKeyRewardsBalance(address: string) {
  return `leaderboard:rewards-balance:${address.toLowerCase()}`;
}

/**
 * GET /kasparex/leaderboard/top100?season=...
 *
 * Strategy:
 * - Try KV cache first (cheap, node-friendly).
 * - If missing, fetch from canonical Kasparex app API (Next) and cache briefly.
 *
 * Notes:
 * - This is intentionally a thin proxy so nodes can serve it.
 * - Canonical storage/immutability remains on the Kasparex side for now.
 */
export async function handleLeaderboardTop100(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const url = new URL(request.url);
    const season = (url.searchParams.get('season') ?? '').trim();
    if (!season) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing season.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const key = cacheKeyTop100(season);
    const cached = await env.KASPAREX_CACHE.get<Top100Response>(key, { type: 'json' });
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
          'X-Cache': 'HIT',
        },
      });
    }

    const canonicalBase = (env.KASPAREX_APP_URL ?? env.KASPAREX_API_URL ?? '').replace(/\/$/, '');
    if (!canonicalBase) {
      return new Response(JSON.stringify({ ok: false, error: 'KASPAREX_APP_URL not configured.' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const upstream = await fetch(`${canonicalBase}/api/leaderboard/top100?season=${encodeURIComponent(season)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
    });
    if (!upstream.ok) {
      return new Response(JSON.stringify({ ok: false, error: `Upstream error (${upstream.status})` }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await upstream.json()) as Top100Response;

    // Cache briefly to reduce central load; nodes will also cache.
    await env.KASPAREX_CACHE.put(key, JSON.stringify(payload), { expirationTtl: 30 });

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Leaderboard top100 error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Failed to fetch snapshot.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET /kasparex/leaderboard/rewards-balance?address=...
 *
 * Node-first friendly proxy for a balance lookup used by leaderboard UI.
 * Short TTL to avoid hammering upstream.
 */
export async function handleLeaderboardRewardsBalance(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const url = new URL(request.url);
    const address = (url.searchParams.get('address') ?? '').trim();
    if (!address) {
      return new Response(JSON.stringify({ success: false, error: 'Address parameter is required', balance: null }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const key = cacheKeyRewardsBalance(address);
    const cached = await env.KASPAREX_CACHE.get<unknown>(key, { type: 'json' });
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=15',
          'X-Cache': 'HIT',
        },
      });
    }

    const canonicalBase = (env.KASPAREX_APP_URL ?? env.KASPAREX_API_URL ?? '').replace(/\/$/, '');
    if (!canonicalBase) {
      return new Response(JSON.stringify({ success: false, error: 'KASPAREX_APP_URL not configured.', balance: null }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const upstream = await fetch(
      `${canonicalBase}/api/leaderboard/rewards-balance?address=${encodeURIComponent(address)}`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
        headers: { Accept: 'application/json' },
      }
    );

    // Upstream returns 200 with success=false sometimes, so just pass through as-is.
    const payload = await upstream.json().catch(() => ({ success: false, error: 'Invalid upstream response', balance: null }));

    await env.KASPAREX_CACHE.put(key, JSON.stringify(payload), { expirationTtl: 15 });

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Leaderboard rewards balance error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch balance.', balance: null }), {
      status: 500,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
    });
  }
}

export async function handleLeaderboardRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === '/kasparex/leaderboard/top100' && request.method === 'GET') {
    return handleLeaderboardTop100(request, env);
  }

  if (pathname === '/kasparex/leaderboard/rewards-balance' && request.method === 'GET') {
    return handleLeaderboardRewardsBalance(request, env);
  }

  return new Response('Not found', {
    status: 404,
    headers: getCorsHeaders(),
  });
}

