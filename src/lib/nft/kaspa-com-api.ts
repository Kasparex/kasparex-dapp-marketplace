/**
 * KaspaCom API Integration
 * Fetches NFT rank data and collection information from KaspaCom
 * 
 * API Documentation: https://docs.google.com/document/d/1Cfk0AcmahhcxsunH1EIudNRs1LpNAqqHswnBXhzKnHE/edit?usp=sharing
 */

const KASPACOM_API_BASE = 'https://api.kaspa.com/api';
const KASPACOM_BASE = 'https://api.kaspa.com';

// Use proxy API route in browser, direct API in server
const getApiUrl = (endpoint: string) => {
  // In browser, use Next.js API proxy to avoid CORS
  if (typeof window !== 'undefined') {
    return `/api/kaspa-com?endpoint=${encodeURIComponent(endpoint)}`;
  }
  // Server-side, use direct API
  return `${KASPACOM_BASE}${endpoint}`;
};

const getApiUrlWithRefresh = (endpoint: string, refresh = false) => {
  if (typeof window !== 'undefined') {
    return `/api/kaspa-com?endpoint=${encodeURIComponent(endpoint)}${refresh ? '&refresh=true' : ''}`;
  }
  return `${KASPACOM_BASE}${endpoint}${refresh ? '?refresh=true' : ''}`;
};

// Helper for POST requests
const postToApi = async (endpoint: string, body: any) => {
  if (typeof window !== 'undefined') {
    // Use proxy for POST requests in browser
    const response = await fetch(`/api/kaspa-com?endpoint=${encodeURIComponent(endpoint)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return response;
  }
  // Server-side, use direct API
  return fetch(`${KASPACOM_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

export interface KaspaComNFTRank {
  tokenId: number;
  rank: number;
  collection: string;
  [key: string]: unknown;
}

export interface KaspaComCollectionRanks {
  collection: string;
  ranks: Map<number, number>; // tokenId -> rank
}

export interface Krc721Collection {
  ticker: string;
  totalSupply: number;
  totalMinted: number;
  totalMintedPercent: number;
  totalHolders: number;
  preMintedSupply: number;
  holders: Array<{
    walletAddress: string;
    tokenIds: number[];
    [key: string]: unknown;
  }>;
  state?: string;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    [key: string]: unknown;
  };
  volume?: number;
  price?: number;
  marketCap?: number;
  volumeUsd?: number;
  volume24h?: number;
  rank?: number;
  deployer?: string;
  buri?: string;
  mintPrice?: number;
  mintFundsRecipient?: string;
  creationDate?: number;
  startMintDate?: number;
  totalVolume?: number;
  [key: string]: unknown;
}

export interface Krc721Token {
  tokenId: number;
  ticker: string;
  image?: string;
  metadata?: {
    name?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    [key: string]: unknown;
  };
  rank?: number;
  price?: number;
  [key: string]: unknown;
}

export interface FilterTokensResponse {
  items: Krc721Token[];
  totalCount: number;
}

/**
 * Cache for rank data
 */
const rankCache = new Map<string, KaspaComCollectionRanks>();
const collectionCache = new Map<string, Krc721Collection>();

/**
 * Fetch collection data by ticker
 */
export async function fetchCollectionByTicker(
  ticker: string,
  refresh = false
): Promise<Krc721Collection | null> {
  const cacheKey = ticker.toUpperCase();

  // Return cached data if available and not refreshing
  if (!refresh && collectionCache.has(cacheKey)) {
    return collectionCache.get(cacheKey)!;
  }

  try {
    const url = getApiUrlWithRefresh(`/krc721/${ticker}`, refresh);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Collection ${ticker} not found`);
        return null;
      }
      throw new Error(`KaspaCom API error: ${response.status} ${response.statusText}`);
    }

    const collection = await response.json() as Krc721Collection;
    
    // Cache the result
    collectionCache.set(cacheKey, collection);

    return collection;
  } catch (error) {
    console.error(`Error fetching collection ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetch rank for a specific NFT
 */
export async function fetchNFTRank(
  collection: string,
  tokenId: number
): Promise<number | null> {
  try {
    // Try to get from cache first
    const cacheKey = collection.toUpperCase();
    const cached = rankCache.get(cacheKey);
    if (cached?.ranks.has(tokenId)) {
      return cached.ranks.get(tokenId)!;
    }

    // Fetch token data using filter endpoint
    const token = await fetchTokenByID(collection, tokenId);
    if (token?.rank) {
      // Update cache
      if (!cached) {
        rankCache.set(cacheKey, {
          collection: collection.toUpperCase(),
          ranks: new Map(),
        });
      }
      rankCache.get(cacheKey)!.ranks.set(tokenId, token.rank);
      return token.rank;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching rank for ${collection} #${tokenId}:`, error);
    return null;
  }
}

/**
 * Fetch a specific token by ID
 */
export async function fetchTokenByID(
  ticker: string,
  tokenId: number
): Promise<Krc721Token | null> {
  try {
    const response = await postToApi('/krc721/tokens', {
      ticker: ticker.toUpperCase(),
      tokenIds: [tokenId],
      limit: 1,
    });

    if (!response.ok) {
      throw new Error(`KaspaCom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as FilterTokensResponse;
    return data.items[0] || null;
  } catch (error) {
    console.error(`Error fetching token ${ticker} #${tokenId}:`, error);
    return null;
  }
}

/**
 * Fetch ranks for an entire collection
 * Uses the filter endpoint to get all tokens with ranks
 */
export async function fetchCollectionRanks(
  collection: string,
  limit = 1000
): Promise<KaspaComCollectionRanks | null> {
  const cacheKey = collection.toUpperCase();

  // Return cached data if available
  if (rankCache.has(cacheKey)) {
    return rankCache.get(cacheKey)!;
  }

  try {
    const ranks = new Map<number, number>();
    let offset = 0;
    let hasMore = true;

    // Fetch tokens in batches
    while (hasMore && ranks.size < limit) {
      const response = await postToApi('/krc721/tokens', {
        ticker: collection.toUpperCase(),
        sortField: 'rank',
        sortDirection: 'asc',
        limit: 100, // Max per request
        offset,
      });

      if (!response.ok) {
        throw new Error(`KaspaCom API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as FilterTokensResponse;
      
      // Extract ranks
      data.items.forEach((token) => {
        if (token.rank !== undefined) {
          ranks.set(token.tokenId, token.rank);
        }
      });

      // Check if there are more items
      hasMore = data.items.length === 100 && ranks.size < data.totalCount;
      offset += 100;
    }

    const result: KaspaComCollectionRanks = {
      collection: collection.toUpperCase(),
      ranks,
    };

    // Cache the result
    rankCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error(`Error fetching ranks for collection ${collection}:`, error);
    return null;
  }
}

/**
 * Fetch ranks for multiple NFTs
 */
export async function fetchMultipleNFTRanks(
  collection: string,
  tokenIds: number[]
): Promise<Map<number, number>> {
  const result = new Map<number, number>();

  try {
    // Use filter endpoint to get specific tokens
    const response = await postToApi('/krc721/tokens', {
      ticker: collection.toUpperCase(),
      tokenIds,
      limit: tokenIds.length,
    });

    if (!response.ok) {
      throw new Error(`KaspaCom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as FilterTokensResponse;
    
    // Extract ranks
    data.items.forEach((token) => {
      if (token.rank !== undefined) {
        result.set(token.tokenId, token.rank);
      }
    });

    return result;
  } catch (error) {
    console.error(`Error fetching ranks for multiple NFTs:`, error);
    return result;
  }
}

/**
 * Fetch tokens filtered by traits
 */
export async function filterTokensByTraits(
  ticker: string,
  traits: Record<string, (string | number)[]>,
  sortField = 'rank',
  sortDirection: 'asc' | 'desc' = 'asc',
  limit = 20,
  offset = 0
): Promise<FilterTokensResponse | null> {
  try {
    const response = await postToApi('/krc721/tokens', {
      ticker: ticker.toUpperCase(),
      traits,
      sortField,
      sortDirection,
      limit,
      offset,
    });

    if (!response.ok) {
      throw new Error(`KaspaCom API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as FilterTokensResponse;
  } catch (error) {
    console.error(`Error filtering tokens by traits:`, error);
    return null;
  }
}

/**
 * Fetch collection floor price
 */
export async function fetchFloorPrice(ticker: string): Promise<number | null> {
  try {
    const url = getApiUrl(`/krc721/floor-price?ticker=${ticker.toUpperCase()}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json() as Array<{ ticker: string; floor_price: number }>;
    const collection = data.find((item) => item.ticker.toUpperCase() === ticker.toUpperCase());
    
    return collection?.floor_price || null;
  } catch (error) {
    console.error(`Error fetching floor price for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetch collection trade statistics
 */
export async function fetchTradeStats(
  ticker: string,
  timeFrame: '30d' | '7d' | '1d' | '6h' | '1h' | '15m' | '12h' = '1d'
) {
  try {
    const url = getApiUrl(`/krc721/trade-stats?timeFrame=${timeFrame}&ticker=${ticker.toUpperCase()}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`KaspaCom API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching trade stats for ${ticker}:`, error);
    return null;
  }
}

/**
 * Clear rank cache
 */
export function clearRankCache(collection?: string): void {
  if (collection) {
    rankCache.delete(collection.toUpperCase());
    collectionCache.delete(collection.toUpperCase());
  } else {
    rankCache.clear();
    collectionCache.clear();
  }
}

/**
 * Check if KaspaCom API is available
 */
export async function checkKaspaComAPI(): Promise<boolean> {
  try {
    // Try to fetch a known collection
    const url = getApiUrl('/krc721/KREXPRIME');
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}
