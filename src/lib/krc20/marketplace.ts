/**
 * Kaspa.com Tokens Marketplace Service
 * 
 * Service for fetching KRC-20 token data from kaspa.com/tokens marketplace
 */

import type { KaspaTokensMarketplaceData, KRC20Token } from './types';

const KASPA_TOKENS_BASE_URL = 'https://kaspa.com/tokens';

/**
 * Fetch all KRC-20 tokens from kaspa.com/tokens marketplace
 */
export async function fetchTokensFromMarketplace(): Promise<KRC20Token[]> {
  // Try multiple endpoint variations
  const endpointVariations = [
    '/api/tokens',
    '/api/v1/tokens',
    '/api/krc20/tokens',
    '/api/v1/krc20/tokens',
    '/tokens',
  ];

  for (const endpoint of endpointVariations) {
    try {
      const url = `${KASPA_TOKENS_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✓ kaspa.com marketplace API success from ${url}`, data);
        
        // Transform marketplace format to our KRC20Token format
        let tokens: any[] = [];
        
        if (Array.isArray(data)) {
          tokens = data;
        } else if (data.tokens && Array.isArray(data.tokens)) {
          tokens = data.tokens;
        } else if (data.data && Array.isArray(data.data)) {
          tokens = data.data;
        }

        if (tokens.length > 0) {
          return tokens.map(transformMarketplaceToken);
        }
      } else if (response.status !== 404) {
        console.debug(`kaspa.com marketplace API error from ${url}: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      // Continue to next endpoint
      if (error.name !== 'AbortError') {
        console.debug(`Failed to fetch from ${KASPA_TOKENS_BASE_URL}${endpoint}:`, error.message);
      }
    }
  }

  // If all endpoints failed, throw an error
  throw new Error('All kaspa.com marketplace endpoint variations failed');
}

/**
 * Fetch a specific token by address from kaspa.com/tokens
 */
export async function fetchTokenByAddressFromMarketplace(address: string): Promise<KRC20Token | null> {
  try {
    const response = await fetch(`${KASPA_TOKENS_BASE_URL}/api/tokens/${address}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch token: ${response.statusText}`);
    }

    const data = await response.json();
    return transformMarketplaceToken(data);
  } catch (error) {
    console.error(`Error fetching token ${address} from kaspa.com/tokens:`, error);
    throw error;
  }
}

/**
 * Fetch a specific token by symbol from kaspa.com/tokens
 */
export async function fetchTokenBySymbolFromMarketplace(symbol: string): Promise<KRC20Token | null> {
  try {
    const response = await fetch(`${KASPA_TOKENS_BASE_URL}/api/tokens/symbol/${symbol.toUpperCase()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch token: ${response.statusText}`);
    }

    const data = await response.json();
    return transformMarketplaceToken(data);
  } catch (error) {
    console.error(`Error fetching token ${symbol} from kaspa.com/tokens:`, error);
    throw error;
  }
}

/**
 * Fetch token data from marketplace page (e.g., KREX: /tokens/marketplace/token/KREX)
 */
export async function fetchTokenFromMarketplacePage(symbol: string): Promise<KRC20Token | null> {
  try {
    // Try to fetch from the marketplace API endpoint
    const token = await fetchTokenBySymbolFromMarketplace(symbol);
    if (token) {
      return token;
    }

    // Fallback: Could scrape the page if needed, but prefer API
    return null;
  } catch (error) {
    console.error(`Error fetching token ${symbol} from marketplace page:`, error);
    return null;
  }
}

/**
 * Transform marketplace token data format to KRC20Token
 */
function transformMarketplaceToken(data: KaspaTokensMarketplaceData | any): KRC20Token {
  return {
    symbol: data.symbol || '',
    name: data.name || '',
    address: data.address || '',
    decimals: data.decimals || 0,
    totalSupply: data.totalSupply,
    logo: data.logo,
    description: data.description,
    website: data.website,
    socialLinks: data.social ? {
      twitter: data.social.twitter,
      telegram: data.social.telegram,
      discord: data.social.discord,
    } : undefined,
    marketData: data.marketData ? {
      price: data.marketData.price,
      marketCap: data.marketData.marketCap,
      volume24h: data.marketData.volume24h,
      holders: data.marketData.holders,
    } : undefined,
  };
}

