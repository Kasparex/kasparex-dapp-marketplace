/**
 * Smart IPFS Gateway Resolver
 * Tries multiple gateways with fallback chain
 */

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
  // In browser, use proxy API route to avoid CORS
  if (typeof window !== 'undefined') {
    try {
      // Clean hash - remove ipfs:// prefix and /ipfs/ prefix if present
      const cleanHash = hash.replace(/^\/?ipfs\//, '').replace(/^ipfs:\/\//, '');
      const proxyUrl = `/api/ipfs?path=${encodeURIComponent(cleanHash)}`;

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
 * Get the best available gateway URL (for direct use in img/src tags)
 * Uses proxy API route in browser to avoid CORS
 */
export function getBestGatewayUrl(hash: string): string {
  // In browser, use proxy API route to avoid CORS
  if (typeof window !== 'undefined') {
    // Clean hash - remove ipfs:// prefix and /ipfs/ prefix if present
    const cleanHash = hash.replace(/^\/?ipfs\//, '').replace(/^ipfs:\/\//, '');
    return `/api/ipfs?path=${encodeURIComponent(cleanHash)}`;
  }
  
  // Server-side, use direct gateway
  return getGatewayUrl(hash, DEFAULT_GATEWAYS[0]);
}

