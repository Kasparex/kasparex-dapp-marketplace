/**
 * Long-lived client cache for Hub fetches (catalog, logos, covenant metadata).
 * Survives within the tab session via memory + localStorage when available.
 */

export const HUB_AGGRESSIVE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type CacheRow<T> = { at: number; value: T };

const memory = new Map<string, CacheRow<unknown>>();

function storageKey(ns: string, key: string): string {
  return `kx.cache.v1:${ns}:${key}`;
}

export function aggressiveCacheGet<T>(ns: string, key: string, ttlMs = HUB_AGGRESSIVE_CACHE_TTL_MS): T | null {
  const mem = memory.get(`${ns}:${key}`);
  if (mem && Date.now() - mem.at < ttlMs) {
    return mem.value as T;
  }

  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(ns, key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheRow<T>;
    if (!parsed || typeof parsed.at !== 'number') return null;
    if (Date.now() - parsed.at >= ttlMs) {
      window.localStorage.removeItem(storageKey(ns, key));
      return null;
    }
    memory.set(`${ns}:${key}`, parsed);
    return parsed.value;
  } catch {
    return null;
  }
}

export function aggressiveCacheSet<T>(ns: string, key: string, value: T): void {
  const row: CacheRow<T> = { at: Date.now(), value };
  memory.set(`${ns}:${key}`, row);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(ns, key), JSON.stringify(row));
  } catch {
    /* quota / private mode */
  }
}

/** Warm browser HTTP cache by prefetching image URLs (fire and forget). */
export function prefetchImageUrls(urls: Array<string | undefined | null>): void {
  if (typeof window === 'undefined') return;
  for (const url of urls) {
    if (!url || (!url.startsWith('http') && !url.startsWith('/'))) continue;
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}
