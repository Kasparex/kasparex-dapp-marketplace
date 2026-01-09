/**
 * KRC721 Stream API Integration
 * Fetches NFT ownership data directly from KRC721 protocol API
 * 
 * API Documentation: https://mainnet.krc721.stream/docs#http-api
 * Endpoint: GET /api/v1/krc721/{network}/address/{address}
 */

const KRC721_STREAM_API_BASE = 'https://mainnet.krc721.stream/api/v1/krc721/mainnet';

export interface KRC721StreamToken {
  tick: string; // Note: API uses "tick" not "ticker"
  tokenId: string; // Note: API returns tokenId as string
  buri?: string; // Base URI for metadata
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
    // Remove kaspa: prefix if present (API expects address without prefix)
    const addressWithoutPrefix = address.replace(/^kaspa:/i, '');
    
    console.log('[KRC721 Stream] Fetching NFTs for address:', addressWithoutPrefix);
    
    const url = `${KRC721_STREAM_API_BASE}/address/${encodeURIComponent(addressWithoutPrefix)}`;
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
