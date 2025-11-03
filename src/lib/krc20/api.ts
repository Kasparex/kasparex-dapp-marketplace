/**
 * KRC-20 Token API Client
 * 
 * Unified API client for fetching KRC-20 token data from multiple sources
 */

import type { KRC20Token, KRC20Balance, KRC20APIError } from './types';
import { 
  fetchTokensFromIndexer, 
  fetchTokenByAddress as fetchTokenByAddressFromIndexer,
  fetchTokenBySymbol as fetchTokenBySymbolFromIndexer 
} from './indexer';
import { 
  fetchTokensFromMarketplace,
  fetchTokenByAddressFromMarketplace,
  fetchTokenBySymbolFromMarketplace,
  fetchTokenFromMarketplacePage 
} from './marketplace';

/**
 * Fetch all available KRC-20 tokens
 * Tries multiple sources and merges results
 */
export async function fetchAllTokens(): Promise<KRC20Token[]> {
  const tokens = new Map<string, KRC20Token>();
  
  // Try indexer first
  try {
    const indexerTokens = await fetchTokensFromIndexer();
    indexerTokens.forEach(token => {
      tokens.set(token.address.toLowerCase(), token);
    });
  } catch (error) {
    console.warn('Failed to fetch from indexer, trying marketplace:', error);
  }

  // Try marketplace as backup/enhancement
  try {
    const marketplaceTokens = await fetchTokensFromMarketplace();
    marketplaceTokens.forEach(token => {
      const existing = tokens.get(token.address.toLowerCase());
      if (existing) {
        // Merge data, preferring marketplace data for market info
        tokens.set(token.address.toLowerCase(), {
          ...existing,
          ...token,
          marketData: token.marketData || existing.marketData,
        });
      } else {
        tokens.set(token.address.toLowerCase(), token);
      }
    });
  } catch (error) {
    console.warn('Failed to fetch from marketplace:', error);
  }

  return Array.from(tokens.values());
}

/**
 * Fetch a specific token by address
 * Tries multiple sources
 */
export async function fetchTokenByAddress(address: string): Promise<KRC20Token | null> {
  // Normalize address
  const normalizedAddress = address.toLowerCase();

  // Try marketplace first (usually has more complete data)
  try {
    const token = await fetchTokenByAddressFromMarketplace(normalizedAddress);
    if (token) {
      return token;
    }
  } catch (error) {
    console.warn(`Failed to fetch token ${address} from marketplace:`, error);
  }

  // Try indexer as fallback
  try {
    const token = await fetchTokenByAddressFromIndexer(normalizedAddress);
    if (token) {
      return token;
    }
  } catch (error) {
    console.warn(`Failed to fetch token ${address} from indexer:`, error);
  }

  return null;
}

/**
 * Fetch a specific token by symbol
 * Tries multiple sources
 */
export async function fetchTokenBySymbol(symbol: string): Promise<KRC20Token | null> {
  const normalizedSymbol = symbol.toUpperCase();

  // Try marketplace first (usually has more complete data)
  try {
    const token = await fetchTokenBySymbolFromMarketplace(normalizedSymbol);
    if (token) {
      return token;
    }
  } catch (error) {
    console.warn(`Failed to fetch token ${symbol} from marketplace:`, error);
  }

  // Try indexer as fallback
  try {
    const token = await fetchTokenBySymbolFromIndexer(normalizedSymbol);
    if (token) {
      return token;
    }
  } catch (error) {
    console.warn(`Failed to fetch token ${symbol} from indexer:`, error);
  }

  // Try marketplace page (e.g., for KREX)
  try {
    const token = await fetchTokenFromMarketplacePage(normalizedSymbol);
    if (token) {
      return token;
    }
  } catch (error) {
    console.warn(`Failed to fetch token ${symbol} from marketplace page:`, error);
  }

  return null;
}

/**
 * Fetch token balances for a given address
 * Note: This requires Kaspa RPC or indexer API that supports balance queries
 */
export async function fetchTokenBalances(address: string): Promise<KRC20Balance[]> {
  // TODO: Implement balance fetching when Kaspa RPC or indexer API is available
  // This would typically involve:
  // 1. Querying the Kaspa RPC for UTXOs associated with KRC-20 tokens
  // 2. Or using an indexer API that provides balance information
  
  console.warn('Token balance fetching not yet implemented - requires Kaspa RPC or indexer API');
  return [];
}

/**
 * Format token balance for display
 */
export function formatTokenBalance(balance: string, decimals: number): string {
  const num = parseFloat(balance);
  if (isNaN(num)) {
    return '0';
  }

  const divisor = Math.pow(10, decimals);
  const formatted = (num / divisor).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  return formatted;
}

/**
 * Validate Kaspa address format
 */
export function isValidKaspaAddress(address: string): boolean {
  // Kaspa addresses can be in format: kaspa:... or just the address
  const kaspaAddressRegex = /^(kaspa:)?[a-z0-9]{34,}$/i;
  return kaspaAddressRegex.test(address);
}

/**
 * Normalize Kaspa address (ensure kaspa: prefix)
 */
export function normalizeKaspaAddress(address: string): string {
  if (address.startsWith('kaspa:')) {
    return address;
  }
  return `kaspa:${address}`;
}

/**
 * Remove kaspa: prefix from address
 */
export function removeKaspaPrefix(address: string): string {
  return address.replace(/^kaspa:/i, '');
}

