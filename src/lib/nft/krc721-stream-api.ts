/**
 * KRC721 Stream API Integration
 * Fetches NFT ownership data directly from KRC721 protocol API
 * 
 * API Endpoint: https://mainnet.krc721.stream/api/v1/krc721/mainnet/address/{address}
 */

const KRC721_STREAM_API_BASE = 'https://mainnet.krc721.stream/api/v1/krc721/mainnet';

export interface KRC721StreamToken {
  ticker: string;
  tokenId: number;
  [key: string]: unknown;
}

export interface KRC721StreamResponse {
  address: string;
  tokens?: KRC721StreamToken[];
  [key: string]: unknown;
}

/**
 * Fetch NFTs owned by an address using KRC721 Stream API
 */
export async function fetchNFTsByAddress(
  address: string
): Promise<KRC721StreamToken[]> {
  try {
    // Remove kaspa: prefix if present (API might not need it)
    const addressWithoutPrefix = address.replace(/^kaspa:/i, '');
    
    console.log('[KRC721 Stream] Fetching NFTs for address:', addressWithoutPrefix);
    
    const url = `${KRC721_STREAM_API_BASE}/address/${encodeURIComponent(addressWithoutPrefix)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[KRC721 Stream] No NFTs found for address (404)');
        return [];
      }
      throw new Error(`KRC721 Stream API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as KRC721StreamResponse;
    
    console.log('[KRC721 Stream] API response:', data);
    
    if (data.tokens && Array.isArray(data.tokens)) {
      console.log(`[KRC721 Stream] ✓ Found ${data.tokens.length} NFTs`);
      return data.tokens;
    }
    
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
  return tokens.filter(token => 
    collectionIds.includes(token.ticker?.toUpperCase() || '')
  );
}
