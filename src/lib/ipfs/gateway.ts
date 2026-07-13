/**
 * Smart IPFS Gateway Resolver
 * Tries multiple gateways with fallback chain
 */

import { DOMAINS } from '@/lib/config/domains';
import { fetchFromPinnedNodes } from '@/lib/nodes/node-first-ipfs';

export interface GatewayConfig {
  primary?: string;
  fallbacks?: string[];
  timeout?: number;
}

const DEFAULT_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs',
  'https://ipfs.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://ipfs.fleek.co/ipfs',
];

/**
 * Get gateway URL for a hash
 */
export function getGatewayUrl(hash: string, gateway?: string): string {
  const baseGateway = gateway || DEFAULT_GATEWAYS[0];
  // Remove trailing slash if present
  const cleanGateway = baseGateway.replace(/\/$/, '');
  // Remove ipfs/ prefix from hash if present
  const cleanHash = hash.replace(/^\/?ipfs\//, '');
  return `${cleanGateway}/${cleanHash}`;
}

/**
 * Try fetching from multiple gateways with fallback
 * Uses proxy API route in browser to avoid CORS
 */
export async function fetchFromGateway(
  hash: string,
  config: GatewayConfig = {}
): Promise<Response | null> {
  const timeout = config.timeout || 2500;
  // In browser, try operator pin nodes first, then hub proxy, then direct gateways.
  if (typeof window !== 'undefined') {
    try {
      const cleanHash = hash.replace(/^\/?ipfs\//, '').replace(/^ipfs:\/\//, '');
      const nodeRes = await fetchFromPinnedNodes(cleanHash, { timeoutMs: timeout });
      if (nodeRes?.ok) return nodeRes;

      const proxyUrl = getIpfsProxyPath(cleanHash);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(proxyUrl, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.warn(`IPFS proxy failed for ${hash}:`, error);
      // Fall through to try direct gateways as fallback
    }
  }

  // Server-side or proxy failed, try direct gateways
  const gateways = [
    config.primary,
    ...(config.fallbacks || []),
    ...DEFAULT_GATEWAYS,
  ].filter(Boolean) as string[];

  for (const gateway of gateways) {
    try {
      const url = getGatewayUrl(hash, gateway);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }
    } catch (error) {
      // Try next gateway
      console.warn(`Gateway ${gateway} failed:`, error);
      continue;
    }
  }

  return null;
}

/**
 * Fetch file from IPFS with gateway fallback
 */
export async function fetchFile(
  hash: string,
  config: GatewayConfig = {}
): Promise<Blob | null> {
  const response = await fetchFromGateway(hash, config);
  if (!response) return null;

  try {
    return await response.blob();
  } catch (error) {
    console.error('Failed to convert response to blob:', error);
    return null;
  }
}

/**
 * Fetch JSON from IPFS with gateway fallback
 */
export async function fetchJSON<T = unknown>(
  hash: string,
  config: GatewayConfig = {}
): Promise<T | null> {
  const response = await fetchFromGateway(hash, config);
  if (!response) return null;

  try {
    return await response.json() as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
}

/**
 * Relative IPFS proxy path used by the hub API route.
 */
export function getIpfsProxyPath(hash: string): string {
  const cleanHash = hash.replace(/^\/?ipfs\//, '').replace(/^ipfs:\/\//, '');
  return `/api/ipfs?path=${encodeURIComponent(cleanHash)}`;
}

function getIpfsProxyOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) return site.replace(/\/$/, '');
  return `https://${DOMAINS.hub}`;
}

/**
 * Full absolute IPFS proxy URL (platform standard for forms, copy/paste, and external links).
 */
export function getIpfsProxyUrl(hash: string): string {
  return `${getIpfsProxyOrigin()}${getIpfsProxyPath(hash)}`;
}

/** Extract a CID/path from a hub IPFS proxy URL or ipfs:// URI. */
export function extractCidFromIpfsUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const url = new URL(raw);
      const pathParam = url.searchParams.get('path');
      if (pathParam) return pathParam.replace(/^\/?ipfs\//, '').replace(/^ipfs:\/\//, '');
      const match = url.pathname.match(/\/ipfs\/([^/?#]+)/);
      if (match?.[1]) return match[1];
    }
  } catch {
    /* fall through */
  }
  if (raw.startsWith('ipfs://')) return raw.replace(/^ipfs:\/\//, '').replace(/^\/?ipfs\//, '');
  if (raw.startsWith('/api/ipfs?')) {
    const pathParam = new URL(raw, 'https://hub.kasparex.com').searchParams.get('path');
    return pathParam?.replace(/^\/?ipfs\//, '').replace(/^ipfs:\/\//, '') ?? null;
  }
  return null;
}

/**
 * Normalize any IPFS reference to the full hub proxy URL.
 */
export function normalizeIpfsUrlForForm(value: string | null | undefined, cid?: string | null): string {
  const direct = value?.trim();
  if (direct) {
    const extracted = extractCidFromIpfsUrl(direct);
    if (extracted) return getIpfsProxyUrl(extracted);
    if (direct.startsWith('http://') || direct.startsWith('https://')) return direct;
    if (direct.startsWith('/api/ipfs')) return `${getIpfsProxyOrigin()}${direct}`;
  }
  if (cid?.trim()) return getIpfsProxyUrl(cid.trim());
  return '';
}

/**
 * Get the best available gateway URL (for direct use in img/src tags and form fields).
 * Returns the full hub IPFS proxy URL in the browser; direct Pinata gateway on SSR fallback.
 */
export function getBestGatewayUrl(hash: string): string {
  const cleanHash = hash.replace(/^\/?ipfs\//, '').replace(/^ipfs:\/\//, '');
  if (typeof window !== 'undefined') {
    return getIpfsProxyPath(cleanHash);
  }
  return getGatewayUrl(cleanHash, DEFAULT_GATEWAYS[0]);
}
