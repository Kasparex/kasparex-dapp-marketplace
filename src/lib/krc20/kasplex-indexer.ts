/**
 * Kasplex Indexer API Client
 * 
 * Client for fetching KRC-20 token data from Kasplex Indexer API
 * Documentation: https://docs-kasplex.gitbook.io/krc20/tools-and-reference/kasplex-indexer-api/krc-20
 */

// Kasplex Indexer API base URL
// Documentation: https://docs-kasplex.gitbook.io/krc20/tools-and-reference/kasplex-indexer-api/krc-20
const KASPLEX_INDEXER_API_BASE = 'https://api.kasplex.org';

export interface KasplexToken {
  tick: string;
  max: string;
  lim?: string;
  dec: string;
  minted?: string;
  holders?: number;
  transactionCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface KasplexTokenListResponse {
  tokens: KasplexToken[];
  total?: number;
}

export interface KasplexTokenDetailResponse {
  token: KasplexToken;
}

/**
 * Fetch list of KRC-20 tokens from Kasplex Indexer
 * API endpoint: GET /krc20/tokens
 */
export async function fetchKasplexTokens(limit: number = 20, offset: number = 0): Promise<KasplexToken[]> {
  try {
    const response = await fetch(
      `${KASPLEX_INDEXER_API_BASE}/krc20/tokens?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Kasplex Indexer API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    }
    
    if (data.tokens && Array.isArray(data.tokens)) {
      return data.tokens;
    }
    
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching tokens from Kasplex Indexer:', error);
    throw error;
  }
}

/**
 * Fetch top KRC-20 tokens sorted by holders or transaction count
 */
export async function fetchTopKasplexTokens(limit: number = 20): Promise<KasplexToken[]> {
  try {
    // Try to fetch with sorting by holders (if API supports it)
    const response = await fetch(
      `${KASPLEX_INDEXER_API_BASE}/krc20/tokens?limit=${limit}&sort=holders&order=desc`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Fallback to regular tokens list if sorting isn't supported
      return await fetchKasplexTokens(limit);
    }

    const data = await response.json();
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    }
    
    if (data.tokens && Array.isArray(data.tokens)) {
      return data.tokens;
    }
    
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }

    // Fallback to regular fetch
    return await fetchKasplexTokens(limit);
  } catch (error) {
    console.error('Error fetching top tokens from Kasplex Indexer:', error);
    // Fallback to regular fetch
    return await fetchKasplexTokens(limit);
  }
}

/**
 * Fetch token details by ticker
 */
export async function fetchKasplexTokenByTick(tick: string): Promise<KasplexToken | null> {
  try {
    const response = await fetch(
      `${KASPLEX_INDEXER_API_BASE}/krc20/tokens/${encodeURIComponent(tick)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Kasplex Indexer API error: ${response.status} ${response.statusText}`);
    }

    const data: KasplexTokenDetailResponse = await response.json();
    return data.token || null;
  } catch (error) {
    console.error(`Error fetching token ${tick} from Kasplex Indexer:`, error);
    return null;
  }
}

/**
 * Convert Kasplex token format to KRC20Token format
 */
export function convertKasplexTokenToKRC20(kasplexToken: KasplexToken, address?: string): import('./types').KRC20Token {
  return {
    address: address || `kasplex:${kasplexToken.tick}`,
    symbol: kasplexToken.tick,
    name: kasplexToken.tick,
    decimals: parseInt(kasplexToken.dec) || 18,
    totalSupply: kasplexToken.max,
    maxSupply: kasplexToken.max,
    limit: kasplexToken.lim,
    minted: kasplexToken.minted,
    holders: kasplexToken.holders,
    transactionCount: kasplexToken.transactionCount,
    createdAt: kasplexToken.createdAt,
    updatedAt: kasplexToken.updatedAt,
  };
}

