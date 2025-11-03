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
  try {
    // Note: Actual API endpoint needs to be verified
    // This is a placeholder structure based on typical marketplace patterns
    const response = await fetch(`${KASPA_TOKENS_BASE_URL}/api/tokens`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform marketplace format to our KRC20Token format
    if (Array.isArray(data)) {
      return data.map(transformMarketplaceToken);
    }
    
    if (data.tokens && Array.isArray(data.tokens)) {
      return data.tokens.map(transformMarketplaceToken);
    }

    return [];
  } catch (error) {
    console.error('Error fetching tokens from kaspa.com/tokens:', error);
    throw error;
  }
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

