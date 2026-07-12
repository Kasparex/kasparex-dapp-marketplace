/**
 * Read-only upstream proxies with KV cache (kasplex indexer, KRC721 stream).
 * Offloads hot reads from Vercel serverless to Cloudflare Worker.
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';

const KASPLEX_BASE = 'https://api.kasplex.org';

const KRC721_DEFAULT_BASES = [
  'https://krc721-indexer.kaspa.com',
  'https://mainnet.krc721.stream',
];

function cacheKey(prefix: string, endpoint: string): string {
  return `proxy:${prefix}:${endpoint}`;
}

function kasplexTtlSec(endpoint: string): number {
  if (/\/address\//.test(endpoint) || /\/balance/.test(endpoint)) return 60;
  return 300;
}

function jsonCorsHeaders(cors: Record<string, string>, ttlSec: number, extra?: Record<string, string>): Record<string, string> {
  return {
    ...cors,
    'Content-Type': 'application/json',
    'Cache-Control': `public, max-age=${ttlSec}, s-maxage=${ttlSec}, stale-while-revalidate=${ttlSec * 2}`,
    ...extra,
  };
}

export async function handleProxyRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const cors = getCorsHeaders();

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        ...cors,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const endpoint = url.searchParams.get('endpoint');
  if (!endpoint || !endpoint.startsWith('/')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid endpoint parameter' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (pathname === '/kasparex/proxy/kasplex') {
    return handleKasplexProxy(env, cors, endpoint);
  }

  if (pathname === '/kasparex/proxy/krc721') {
    return handleKrc721Proxy(env, cors, endpoint);
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

async function handleKasplexProxy(env: Env, cors: Record<string, string>, endpoint: string): Promise<Response> {
  const ttl = kasplexTtlSec(endpoint);
  const key = cacheKey('kasplex', endpoint);

  const cached = await env.KASPAREX_CACHE.get(key);
  if (cached) {
    return new Response(cached, {
      status: 200,
      headers: jsonCorsHeaders(cors, ttl, { 'X-Cache': 'HIT' }),
    });
  }

  try {
    const upstream = await fetch(`${KASPLEX_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Kasparex-Worker-Proxy/1.0',
      },
      signal: AbortSignal.timeout(15000),
    });

    const body = await upstream.text();

    if (upstream.ok) {
      await env.KASPAREX_CACHE.put(key, body, { expirationTtl: ttl });
      return new Response(body, {
        status: 200,
        headers: jsonCorsHeaders(cors, ttl, { 'X-Cache': 'MISS' }),
      });
    }

    return new Response(body || JSON.stringify({ error: `Kasplex upstream HTTP ${upstream.status}` }), {
      status: upstream.status,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch from Kasplex Indexer API',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }
}

async function handleKrc721Proxy(env: Env, cors: Record<string, string>, endpoint: string): Promise<Response> {
  const ttl = 120;
  const key = cacheKey('krc721', endpoint);

  const cached = await env.KASPAREX_CACHE.get(key);
  if (cached) {
    return new Response(cached, {
      status: 200,
      headers: jsonCorsHeaders(cors, ttl, { 'X-Cache': 'HIT' }),
    });
  }

  let lastError = 'All KRC721 indexers failed';

  for (const base of KRC721_DEFAULT_BASES) {
    try {
      const upstream = await fetch(`${base}${endpoint}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Kasparex-Worker-Proxy/1.0',
        },
        signal: AbortSignal.timeout(20000),
      });

      const body = await upstream.text();

      if (upstream.ok) {
        await env.KASPAREX_CACHE.put(key, body, { expirationTtl: ttl });
        return new Response(body, {
          status: 200,
          headers: jsonCorsHeaders(cors, ttl, { 'X-Cache': 'MISS', 'X-KRC721-Indexer': base }),
        });
      }

      if (upstream.status === 404 || upstream.status === 400) {
        return new Response(body || JSON.stringify({ message: 'empty', result: [] }), {
          status: 200,
          headers: jsonCorsHeaders(cors, ttl, { 'X-KRC721-Indexer': base }),
        });
      }

      lastError = `KRC721 indexer ${base} error: ${upstream.status} ${upstream.statusText}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown indexer error';
    }
  }

  return new Response(JSON.stringify({ error: 'Failed to fetch from KRC721 indexer', details: lastError }), {
    status: 502,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
