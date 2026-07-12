import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { KrexNodeConfig } from './config.js';
import { getRequestsServedTotal, initMetrics, recordRequest } from './metrics.js';

type CacheEntry = {
  status: number;
  body: string;
  contentType: string;
  extraHeaders: Record<string, string>;
  expiresAt: number;
};

const MAX_CACHE_ENTRIES = 512;

const cache = new Map<string, CacheEntry>();

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  };
}

function ttlForPath(pathname: string, search: string): number {
  if (pathname.startsWith('/kasparex/wallet/')) return 10;
  if (pathname.startsWith('/kasparex/proxy/krc721')) return 120;
  if (pathname.startsWith('/kasparex/proxy/kasplex')) {
    const endpoint = new URLSearchParams(search).get('endpoint') ?? '';
    if (/\/address\//.test(endpoint) || /\/balance/.test(endpoint)) return 60;
    return 300;
  }
  if (pathname.startsWith('/kasparex/stats')) return 30;
  if (pathname.startsWith('/kasparex/nodes')) return 30;
  if (pathname.startsWith('/kasparex/rewards/')) return 15;
  if (pathname.startsWith('/kasparex/diamonds/')) return 15;
  return 30;
}

function trimCache(): void {
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  const firstKey = cache.keys().next().value;
  if (firstKey) cache.delete(firstKey);
}

function writeJson(res: ServerResponse, status: number, payload: unknown, extra?: Record<string, string>): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...corsHeaders(),
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...extra,
  });
  res.end(body);
}

async function readUpstream(
  upstreamUrl: string,
  ttlSec: number,
): Promise<{ status: number; body: string; contentType: string; extraHeaders: Record<string, string> }> {
  const now = Date.now();
  const cached = cache.get(upstreamUrl);
  if (cached && cached.expiresAt > now) {
    return {
      status: cached.status,
      body: cached.body,
      contentType: cached.contentType,
      extraHeaders: { ...cached.extraHeaders, 'X-Krex-Cache': 'HIT' },
    };
  }

  const res = await fetch(upstreamUrl, {
    method: 'GET',
    headers: { Accept: 'application/json', 'User-Agent': 'Kasparex-Krex-Node/1.0' },
    signal: AbortSignal.timeout(20_000),
  });
  const body = await res.text();
  const contentType = res.headers.get('content-type') ?? 'application/json';
  const extraHeaders: Record<string, string> = { 'X-Krex-Cache': 'MISS' };
  const indexer = res.headers.get('X-KRC721-Indexer');
  if (indexer) extraHeaders['X-KRC721-Indexer'] = indexer;

  if (res.ok) {
    cache.set(upstreamUrl, {
      status: res.status,
      body,
      contentType,
      extraHeaders: { ...extraHeaders },
      expiresAt: now + ttlSec * 1000,
    });
    trimCache();
  }

  return { status: res.status, body, contentType, extraHeaders };
}

function upstreamUrl(cfg: KrexNodeConfig, pathname: string, search: string): string | null {
  const base = cfg.apiBaseUrl.replace(/\/+$/, '');

  if (pathname === '/health') return null;

  if (pathname.startsWith('/kasparex/')) {
    return `${base}${pathname}${search}`;
  }

  if (pathname === '/proxy/kasplex' || pathname === '/proxy/krc721') {
    const endpoint = new URLSearchParams(search).get('endpoint');
    if (!endpoint?.startsWith('/')) return null;
    const kind = pathname === '/proxy/kasplex' ? 'kasplex' : 'krc721';
    return `${base}/kasparex/proxy/${kind}?endpoint=${encodeURIComponent(endpoint)}`;
  }

  return null;
}

async function handleRequest(cfg: KrexNodeConfig, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const method = req.method ?? 'GET';
  if (method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (method !== 'GET') {
    writeJson(res, 405, { error: 'Method not allowed. Mirror nodes are read-only.' });
    return;
  }

  const host = req.headers.host ?? 'localhost';
  const url = new URL(req.url ?? '/', `http://${host}`);
  const { pathname, search } = url;

  if (pathname === '/health') {
    recordRequest();
    writeJson(res, 200, {
      status: 'ok',
      service: 'Krex Node Mirror',
      nodeId: cfg.nodeId,
      role: cfg.role ?? 'mirror',
      version: cfg.version,
      requestsServedTotal: getRequestsServedTotal(),
      cacheEntries: cache.size,
      timestamp: Date.now(),
    });
    return;
  }

  const target = upstreamUrl(cfg, pathname, search);
  if (!target) {
    writeJson(res, 404, { error: 'Not found', path: pathname });
    return;
  }

  try {
    recordRequest();
    const ttlPath = pathname.startsWith('/proxy/kasplex')
      ? '/kasparex/proxy/kasplex'
      : pathname.startsWith('/proxy/krc721')
        ? '/kasparex/proxy/krc721'
        : pathname;
    const ttl = ttlForPath(ttlPath, search);
    const upstream = await readUpstream(target, ttl);
    res.writeHead(upstream.status, {
      ...corsHeaders(),
      'Content-Type': upstream.contentType,
      'Cache-Control': `public, max-age=${ttl}`,
      ...upstream.extraHeaders,
      'X-Krex-Node': cfg.nodeId,
    });
    res.end(upstream.body);
  } catch (error) {
    writeJson(res, 502, {
      error: 'Upstream fetch failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export function startMirrorServer(cfg: KrexNodeConfig): Promise<{ close: () => Promise<void> }> {
  initMetrics(cfg.requestsServedTotal ?? 0);

  const host = cfg.serveHost?.trim() || '0.0.0.0';
  const port = Math.max(1024, Math.min(65535, Number(cfg.servePort) || 8788));

  const server = createServer((req, res) => {
    handleRequest(cfg, req, res).catch((error) => {
      writeJson(res, 500, {
        error: 'Internal mirror error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      console.log(`[krex-node] mirror listening on http://${host}:${port}`);
      console.log(`[krex-node] pass-through upstream: ${cfg.apiBaseUrl.replace(/\/+$/, '')}`);
      resolve({
        close: () =>
          new Promise<void>((done, err) => {
            server.close((e) => (e ? err(e) : done()));
          }),
      });
    });
  });
}
