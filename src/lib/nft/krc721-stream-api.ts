/**
 * KRC721 Stream API Integration
 * Fetches NFT ownership data directly from KRC721 protocol API
 * 
 * API Documentation: https://mainnet.krc721.stream/docs#http-api
 * Endpoint: GET /api/v1/krc721/{network}/address/{address}
 */

const KRC721_STREAM_API_BASE = 'https://mainnet.krc721.stream/api/v1/krc721/mainnet';

function getApiUrl(endpoint: string): string {
  // In browser, use proxy route to avoid CORS.
  if (typeof window !== 'undefined') {
    return `/api/krc721-stream?endpoint=${encodeURIComponent(endpoint)}`;
  }
  return `https://mainnet.krc721.stream${endpoint}`;
}

export interface KRC721StreamToken {
  tick: string; // Note: API uses "tick" not "ticker"
  tokenId: string; // Note: API returns tokenId as string
  /** Base URI for token metadata (field name varies by API version) */
  buri?: string;
  baseUri?: string;
  base_uri?: string;
  [key: string]: unknown;
}

export interface KRC721StreamResponse {
  message: string; // Should be "success" if successful
  result?: KRC721StreamToken[]; // Array of tokens
  next?: string; // Pagination offset
  [key: string]: unknown;
}

/**
 * Fetch NFTs owned by an address using KRC721 Stream API
 * 
 * API Response format:
 * {
 *   "message": "success",
 *   "result": [
 *     {
 *       "tick": "FOO",
 *       "tokenId": "381",
 *       "buri": "ipfs://..."
 *     }
 *   ],
 *   "next": "FOO-123" (optional, for pagination)
 * }
 */
export async function fetchNFTsByAddress(
  address: string
): Promise<KRC721StreamToken[]> {
  try {
    // API requires kaspa: prefix - ensure it's present
    const normalizedAddress = address.startsWith('kaspa:') 
      ? address 
      : `kaspa:${address}`;
    
    console.log('[KRC721 Stream] Fetching NFTs for address:', normalizedAddress);
    
    const endpoint = `/api/v1/krc721/mainnet/address/${encodeURIComponent(normalizedAddress)}`;
    const url = getApiUrl(endpoint);
    console.log('[KRC721 Stream] API URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    console.log('[KRC721 Stream] Response status:', response.status, response.statusText);

    if (!response.ok) {
      if (response.status === 404 || response.status === 400) {
        console.log('[KRC721 Stream] No NFTs found for address');
        return [];
      }
      const errorText = await response.text();
      console.error('[KRC721 Stream] API error response:', errorText);
      throw new Error(`KRC721 Stream API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as KRC721StreamResponse;
    
    console.log('[KRC721 Stream] API response:', data);
    console.log('[KRC721 Stream] Message:', data.message);
    
    // Check if request was successful
    if (data.message === 'success' && data.result && Array.isArray(data.result)) {
      console.log(`[KRC721 Stream] ✓ Found ${data.result.length} NFTs`);
      return data.result;
    }
    
    console.warn('[KRC721 Stream] Unexpected response format:', data);
    return [];
  } catch (error) {
    console.error('[KRC721 Stream] Error fetching NFTs:', error);
    return [];
  }
}

/** Resolve metadata base URI from a stream token (handles alternate JSON keys). */
export function streamTokenBaseUri(token: KRC721StreamToken): string | null {
  const t = token as Record<string, unknown>;
  const candidates = [token.buri, token.baseUri, token.base_uri, t.BURI, t.baseURI, t.metadataUri, t.metadata_uri]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((s) => s.trim());
  return candidates[0] ?? null;
}

/**
 * Build IPFS path (CID/subpath) for `{tokenId}.json` under the collection base URI. */
export function streamMetaJsonPathFromBaseUri(baseUri: string, tokenId: number): string | null {
  const s = baseUri.trim();
  if (!s) return null;
  let rest = s;
  if (rest.startsWith('ipfs://')) {
    rest = rest.replace(/^ipfs:\/\//i, '').replace(/\/+$/, '');
  } else if (rest.includes('/ipfs/')) {
    const parts = rest.split('/ipfs/');
    rest = (parts[1] ?? '').replace(/\/+$/, '');
  }
  if (!rest) return null;
  return `${rest}/${tokenId}.json`;
}

/**
 * Filter NFTs by collection tickers
 */
export function filterNFTsByCollections(
  tokens: KRC721StreamToken[],
  collectionIds: string[]
): KRC721StreamToken[] {
  return tokens.filter(token => {
    const tick = token.tick?.toUpperCase() || '';
    return collectionIds.includes(tick);
  });
}
