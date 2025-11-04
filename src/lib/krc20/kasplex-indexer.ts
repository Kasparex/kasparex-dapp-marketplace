/**
 * Kasplex Indexer API Client
 * 
 * Client for fetching KRC-20 token data from Kasplex Indexer API
 * Documentation: https://docs-kasplex.gitbook.io/krc20/tools-and-reference/kasplex-indexer-api/krc-20
 */

// Kasplex Indexer API base URL
// Documentation: https://docs-kasplex.gitbook.io/krc20/tools-and-reference/kasplex-indexer-api/krc-20
// Try different possible base URLs
const KASPLEX_INDEXER_API_BASE_OPTIONS = [
  'https://api.kasplex.org',
  'https://indexer.kasplex.org',
  'https://tn10api.kasplex.org', // Testnet API
];
const KASPLEX_INDEXER_API_BASE = KASPLEX_INDEXER_API_BASE_OPTIONS[0];

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
 * API endpoint: GET /krc20/tokens or GET /api/krc20/tokens
 */
export async function fetchKasplexTokens(limit: number = 20, offset: number = 0): Promise<KasplexToken[]> {
  // Try different endpoint variations
  const endpointVariations = [
    `/krc20/tokens`,
    `/api/krc20/tokens`,
    `/v1/krc20/tokens`,
    `/krc20`,
  ];

  for (const baseUrl of KASPLEX_INDEXER_API_BASE_OPTIONS) {
    for (const endpoint of endpointVariations) {
      try {
        const url = `${baseUrl}${endpoint}?limit=${limit}&offset=${offset}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // Add cache control to avoid stale data
          cache: 'no-store',
        });

        if (response.ok) {
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

          if (data.result && Array.isArray(data.result)) {
            return data.result;
          }

          // If we got a 200 but no data structure we recognize, continue to next endpoint
          if (response.status === 200) {
            console.warn(`Kasplex API returned 200 but unrecognized data structure from ${url}`);
          }
        } else if (response.status !== 404) {
          // Only log non-404 errors (404 means endpoint doesn't exist, try next)
          console.warn(`Kasplex API error ${response.status} from ${url}`);
        }
      } catch (error) {
        // Continue to next endpoint on error
        console.debug(`Failed to fetch from ${baseUrl}${endpoint}:`, error);
      }
    }
  }

  // If all endpoints failed, throw an error
  throw new Error('Kasplex Indexer API: All endpoint variations failed. Please check the API documentation for the correct endpoint.');
}

/**
 * Fetch top KRC-20 tokens sorted by holders or transaction count
 */
export async function fetchTopKasplexTokens(limit: number = 20): Promise<KasplexToken[]> {
  // Try sorting variations first
  const sortVariations = [
    `?limit=${limit}&sort=holders&order=desc`,
    `?limit=${limit}&sort=transactionCount&order=desc`,
    `?limit=${limit}&order=desc`,
    `?limit=${limit}`,
  ];

  for (const baseUrl of KASPLEX_INDEXER_API_BASE_OPTIONS) {
    const endpointVariations = [
      `/krc20/tokens`,
      `/api/krc20/tokens`,
      `/v1/krc20/tokens`,
    ];

    for (const endpoint of endpointVariations) {
      for (const sortParams of sortVariations) {
        try {
          const url = `${baseUrl}${endpoint}${sortParams}`;
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            cache: 'no-store',
          });

          if (response.ok) {
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

            if (data.result && Array.isArray(data.result)) {
              return data.result;
            }
          }
        } catch (error) {
          // Continue to next variation
          console.debug(`Failed to fetch top tokens from ${baseUrl}${endpoint}${sortParams}:`, error);
        }
      }
    }
  }

  // Fallback to regular fetch without sorting
  try {
    return await fetchKasplexTokens(limit);
  } catch (error) {
    console.error('Error fetching top tokens from Kasplex Indexer:', error);
    throw error;
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

