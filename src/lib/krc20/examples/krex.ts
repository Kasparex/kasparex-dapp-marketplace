/**
 * KREX Token Example Implementation
 * 
 * Special implementation for KREX token with enhanced features
 */

import type { KRC20Token } from '../types';
import { fetchTokenBySymbol } from '../api';

/**
 * KREX Token Metadata
 */
export const KREX_TOKEN_SYMBOL = 'KREX';
export const KREX_TOKEN_MARKETPLACE_URL = 'https://kaspa.com/tokens/marketplace/token/KREX';
export const KREX_TOKEN_INDEXER_URL = 'https://kas.fyi/krc20-tokens';

/**
 * Default KREX token data (fallback if API fails)
 */
export const DEFAULT_KREX_TOKEN: KRC20Token = {
  symbol: 'KREX',
  name: 'Kasparex Token',
  address: '', // Will be fetched from API
  decimals: 8,
  description: 'The official Kasparex token for the Kaspa ecosystem',
  website: 'https://www.kasparex.com',
  socialLinks: {
    twitter: 'https://x.com/kasparex',
    telegram: 'https://t.me/kasparex',
  },
  logo: '/img/tokens/krex.png',
};

/**
 * Fetch KREX token data
 */
export async function fetchKREXToken(): Promise<KRC20Token | null> {
  try {
    const token = await fetchTokenBySymbol(KREX_TOKEN_SYMBOL);
    if (token) {
      return token;
    }
    // Fallback to default if API doesn't return data
    return DEFAULT_KREX_TOKEN;
  } catch (error) {
    console.error('Error fetching KREX token:', error);
    // Return default token data as fallback
    return DEFAULT_KREX_TOKEN;
  }
}

/**
 * Check if a token is KREX
 */
export function isKREXToken(token: KRC20Token | string): boolean {
  if (typeof token === 'string') {
    return token.toUpperCase() === KREX_TOKEN_SYMBOL;
  }
  return token.symbol.toUpperCase() === KREX_TOKEN_SYMBOL;
}

