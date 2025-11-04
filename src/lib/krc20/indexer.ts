/**
 * Kas.fyi KRC-20 Indexer Service
 * 
 * Service for fetching KRC-20 token data from kas.fyi indexer
 * Documentation: https://docs.kas.fyi/
 */

import type { KasFyiTokenData, KRC20Token } from './types';

const KAS_FYI_BASE_URL = 'https://kas.fyi';
const KAS_FYI_API_BASE_URL = 'https://api.kas.fyi';

/**
 * Fetch all KRC-20 tokens from kas.fyi indexer
 */
export async function fetchTokensFromIndexer(limit: number = 100): Promise<KRC20Token[]> {
  // Try different endpoint variations based on common API patterns
  const endpointVariations = [
    { base: KAS_FYI_API_BASE_URL, path: '/v1/krc20/tokens' },
    { base: KAS_FYI_API_BASE_URL, path: '/api/v1/krc20/tokens' },
    { base: KAS_FYI_API_BASE_URL, path: '/krc20/tokens' },
    { base: KAS_FYI_BASE_URL, path: '/api/krc20-tokens' },
    { base: KAS_FYI_BASE_URL, path: '/api/v1/krc20-tokens' },
    { base: KAS_FYI_BASE_URL, path: '/krc20-tokens' },
  ];

  const errors: string[] = [];

  for (const { base, path } of endpointVariations) {
    try {
      const url = `${base}${path}${path.includes('?') ? '&' : '?'}limit=${limit}`;
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          // Transform kas.fyi format to our KRC20Token format
          let tokens: any[] = [];
          
          if (Array.isArray(data)) {
            tokens = data;
          } else if (data.tokens && Array.isArray(data.tokens)) {
            tokens = data.tokens;
          } else if (data.data && Array.isArray(data.data)) {
            tokens = data.data;
          } else if (data.result && Array.isArray(data.result)) {
            tokens = data.result;
          }

          if (tokens.length > 0) {
            return tokens.map(transformKasFyiToken).filter(token => token.symbol && token.symbol.length > 0);
          }
        } else if (response.status !== 404) {
          const errorMsg = `${url}: ${response.status} ${response.statusText}`;
          console.warn(`kas.fyi API error: ${errorMsg}`);
          errors.push(errorMsg);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          errors.push(`${url}: Request timeout`);
        } else {
          errors.push(`${url}: ${fetchError.message}`);
        }
        console.debug(`Failed to fetch from ${url}:`, fetchError);
      }
    } catch (error: any) {
      errors.push(`${base}${path}: ${error.message}`);
      console.debug(`Failed to fetch from ${base}${path}:`, error);
    }
  }

  // If all endpoints failed, throw an error with details
  throw new Error(`kas.fyi Indexer API: All endpoint variations failed. Attempted: ${errors.length} endpoints. Please check the API documentation at https://docs.kas.fyi/`);
}

/**
 * Fetch a specific token by address from kas.fyi
 */
export async function fetchTokenByAddress(address: string): Promise<KRC20Token | null> {
  const endpointVariations = [
    `${KAS_FYI_API_BASE_URL}/v1/krc20/tokens/${encodeURIComponent(address)}`,
    `${KAS_FYI_API_BASE_URL}/krc20/tokens/${encodeURIComponent(address)}`,
    `${KAS_FYI_BASE_URL}/api/krc20-tokens/${encodeURIComponent(address)}`,
    `${KAS_FYI_BASE_URL}/api/v1/krc20-tokens/${encodeURIComponent(address)}`,
  ];

  for (const url of endpointVariations) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const token = data.token || data;
          return transformKasFyiToken(token);
        } else if (response.status === 404) {
          return null;
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name !== 'AbortError') {
          console.debug(`Failed to fetch token from ${url}:`, fetchError);
        }
      }
    } catch (error) {
      console.debug(`Error fetching token ${address} from ${url}:`, error);
    }
  }

  return null;
}

/**
 * Fetch a specific token by symbol from kas.fyi
 */
export async function fetchTokenBySymbol(symbol: string): Promise<KRC20Token | null> {
  const normalizedSymbol = symbol.toUpperCase();
  const endpointVariations = [
    `${KAS_FYI_API_BASE_URL}/v1/krc20/tokens/symbol/${encodeURIComponent(normalizedSymbol)}`,
    `${KAS_FYI_API_BASE_URL}/krc20/tokens/symbol/${encodeURIComponent(normalizedSymbol)}`,
    `${KAS_FYI_BASE_URL}/api/krc20-tokens/symbol/${encodeURIComponent(normalizedSymbol)}`,
    `${KAS_FYI_BASE_URL}/api/v1/krc20-tokens/symbol/${encodeURIComponent(normalizedSymbol)}`,
  ];

  for (const url of endpointVariations) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const token = data.token || data;
          return transformKasFyiToken(token);
        } else if (response.status === 404) {
          return null;
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name !== 'AbortError') {
          console.debug(`Failed to fetch token from ${url}:`, fetchError);
        }
      }
    } catch (error) {
      console.debug(`Error fetching token ${symbol} from ${url}:`, error);
    }
  }

  return null;
}

/**
 * Transform kas.fyi token data format to KRC20Token
 */
function transformKasFyiToken(data: KasFyiTokenData | any): KRC20Token {
  // Handle different possible field names from the API
  const ticker = data.tick || data.ticker || data.symbol || '';
  const maxSupply = data.max || data.maxSupply || data.totalSupply;
  const minted = data.minted || data.mintedSupply;
  const dec = data.dec || data.decimals;
  
  return {
    symbol: ticker,
    name: data.name || ticker,
    address: data.address || data.contractAddress || `kas.fyi:${ticker}`,
    decimals: typeof dec === 'string' ? parseInt(dec, 10) : (dec || 18),
    totalSupply: data.totalSupply || maxSupply,
    maxSupply: maxSupply,
    limit: data.lim || data.limit,
    minted: minted,
    holders: data.holders || data.holderCount,
    transactionCount: data.transactionCount || data.txCount || data.transactions,
    logo: data.logo || data.logoUrl || data.image,
    description: data.description,
    website: data.website || data.url,
    socialLinks: data.social ? {
      twitter: data.social.twitter || data.twitter,
      telegram: data.social.telegram || data.telegram,
      discord: data.social.discord || data.discord,
    } : undefined,
    createdAt: data.createdAt || data.created_at || data.timestamp,
    creator: data.creator || data.creatorAddress,
  };
}

