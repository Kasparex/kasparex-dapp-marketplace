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
 */
export async function fetchFromGateway(
  hash: string,
  config: GatewayConfig = {}
): Promise<Response | null> {
  const gateways = [
    config.primary,
    ...(config.fallbacks || []),
    ...DEFAULT_GATEWAYS,
  ].filter(Boolean) as string[];

  const timeout = config.timeout || 5000;

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
 */
export function getBestGatewayUrl(hash: string): string {
  // Prefer Pinata gateway first, then fallback to public gateways
  return getGatewayUrl(hash, DEFAULT_GATEWAYS[0]);
}



