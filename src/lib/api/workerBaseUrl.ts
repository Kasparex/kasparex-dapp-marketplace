/**
 * Resolve Kasparex Worker API base URL.
 * Browser uses same-origin Next proxy to avoid CORS and wrong public defaults.
 */

const WORKER_FALLBACK = 'https://kasparex-api.kasparexcom.workers.dev';

export function workerUpstreamBase(): string {
  return (
    process.env.KASPAREX_INTERNAL_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_KASPAREX_API_URL?.trim() ||
    WORKER_FALLBACK
  ).replace(/\/$/, '');
}

export function kasparexApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/kasparex-worker';
  }
  return workerUpstreamBase();
}
