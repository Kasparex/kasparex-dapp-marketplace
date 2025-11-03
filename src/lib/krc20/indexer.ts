/**
 * Kas.fyi KRC-20 Indexer Service
 * 
 * Service for fetching KRC-20 token data from kas.fyi indexer
 */

import type { KasFyiTokenData, KRC20Token } from './types';

const KAS_FYI_BASE_URL = 'https://kas.fyi';

/**
 * Fetch all KRC-20 tokens from kas.fyi indexer
 */
export async function fetchTokensFromIndexer(): Promise<KRC20Token[]> {
  try {
    // Note: Actual API endpoint needs to be verified
    // This is a placeholder structure based on typical indexer patterns
    const response = await fetch(`${KAS_FYI_BASE_URL}/api/krc20-tokens`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform kas.fyi format to our KRC20Token format
    if (Array.isArray(data)) {
      return data.map(transformKasFyiToken);
    }
    
    if (data.tokens && Array.isArray(data.tokens)) {
      return data.tokens.map(transformKasFyiToken);
    }

    return [];
  } catch (error) {
    console.error('Error fetching tokens from kas.fyi:', error);
    throw error;
  }
}

/**
 * Fetch a specific token by address from kas.fyi
 */
export async function fetchTokenByAddress(address: string): Promise<KRC20Token | null> {
  try {
    const response = await fetch(`${KAS_FYI_BASE_URL}/api/krc20-tokens/${address}`, {
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
    return transformKasFyiToken(data);
  } catch (error) {
    console.error(`Error fetching token ${address} from kas.fyi:`, error);
    throw error;
  }
}

/**
 * Fetch a specific token by symbol from kas.fyi
 */
export async function fetchTokenBySymbol(symbol: string): Promise<KRC20Token | null> {
  try {
    const response = await fetch(`${KAS_FYI_BASE_URL}/api/krc20-tokens/symbol/${symbol.toUpperCase()}`, {
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
    return transformKasFyiToken(data);
  } catch (error) {
    console.error(`Error fetching token ${symbol} from kas.fyi:`, error);
    throw error;
  }
}

/**
 * Transform kas.fyi token data format to KRC20Token
 */
function transformKasFyiToken(data: KasFyiTokenData | any): KRC20Token {
  return {
    symbol: data.ticker || data.symbol || '',
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
    createdAt: data.createdAt,
    creator: data.creator,
  };
}

