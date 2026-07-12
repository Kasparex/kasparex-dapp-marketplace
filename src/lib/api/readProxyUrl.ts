/**
 * Resolve read-only proxy URLs: prefer Cloudflare Worker when configured,
 * fall back to Next.js /api routes (local dev or legacy).
 */

const WORKER_BASE = (process.env.NEXT_PUBLIC_KASPAREX_API_URL ?? '').replace(/\/$/, '');

function endpointQuery(endpoint: string): string {
  return `endpoint=${encodeURIComponent(endpoint)}`;
}

export function kasplexProxyUrl(endpoint: string): string {
  const q = endpointQuery(endpoint);
  if (WORKER_BASE) return `${WORKER_BASE}/kasparex/proxy/kasplex?${q}`;
  return `/api/kasplex-indexer?${q}`;
}

export function krc721ProxyUrl(endpoint: string): string {
  const q = endpointQuery(endpoint);
  if (WORKER_BASE) return `${WORKER_BASE}/kasparex/proxy/krc721?${q}`;
  return `/api/krc721-stream?${q}`;
}

export function readProxyUsesWorker(): boolean {
  return Boolean(WORKER_BASE);
}
