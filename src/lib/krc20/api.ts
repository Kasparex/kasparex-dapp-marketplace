/**
 * KRC-20 Token API Client
 * 
 * Unified API client for fetching KRC-20 token data from multiple sources
 * Priority order: kas.fyi indexer > Kasplex Indexer > kaspa.com marketplace
 */

import type { KRC20Token, KRC20Balance, KRC20APIError } from './types';
import { 
  fetchTokensFromIndexer, 
  fetchTokenByAddress as fetchTokenByAddressFromIndexer,
  fetchTokenBySymbol as fetchTokenBySymbolFromIndexer 
} from './indexer';
import {
  fetchTopKasplexTokens,
  convertKasplexTokenToKRC20,
} from './kasplex-indexer';
import { 
  fetchTokensFromMarketplace,
  fetchTokenByAddressFromMarketplace,
  fetchTokenBySymbolFromMarketplace,
  fetchTokenFromMarketplacePage 
} from './marketplace';

/**
 * API source tracking for debugging
 */
export interface FetchResult {
  source: string;
  success: boolean;
  tokenCount: number;
  error?: string;
}

/**
 * Fetch all available KRC-20 tokens
 * Tries multiple sources in priority order and merges results
 */
export async function fetchAllTokens(limit: number = 100): Promise<KRC20Token[]> {
  const tokens = new Map<string, KRC20Token>();
  const results: FetchResult[] = [];
  
  // Priority 1: kas.fyi indexer (most reliable)
  try {
    const indexerTokens = await fetchTokensFromIndexer(limit);
    indexerTokens.forEach(token => {
      if (isValidToken(token)) {
        const key = token.symbol.toLowerCase();
        tokens.set(key, token);
      }
    });
    results.push({ source: 'kas.fyi', success: true, tokenCount: indexerTokens.length });
    console.log(`✓ Fetched ${indexerTokens.length} tokens from kas.fyi`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.push({ source: 'kas.fyi', success: false, tokenCount: 0, error: errorMsg });
    console.warn('Failed to fetch from kas.fyi indexer:', error);
  }

  // Priority 2: Kasplex Indexer
  try {
    const kasplexTokens = await fetchTopKasplexTokens(limit);
    kasplexTokens.forEach(kasplexToken => {
      const token = convertKasplexTokenToKRC20(kasplexToken);
      if (isValidToken(token)) {
        const key = token.symbol.toLowerCase();
        const existing = tokens.get(key);
        if (existing) {
          // Merge data, preferring existing data but adding missing fields
          tokens.set(key, {
            ...existing,
            ...token,
            // Keep existing address if it's more specific
            address: existing.address && !existing.address.startsWith('kasplex:') && !existing.address.startsWith('kas.fyi:') 
              ? existing.address 
              : token.address,
            // Merge numeric fields, preferring higher values
            holders: Math.max(existing.holders || 0, token.holders || 0),
            transactionCount: Math.max(existing.transactionCount || 0, token.transactionCount || 0),
          });
        } else {
          tokens.set(key, token);
        }
      }
    });
    results.push({ source: 'Kasplex', success: true, tokenCount: kasplexTokens.length });
    console.log(`✓ Fetched ${kasplexTokens.length} tokens from Kasplex Indexer`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.push({ source: 'Kasplex', success: false, tokenCount: 0, error: errorMsg });
    console.warn('Failed to fetch from Kasplex Indexer:', error);
  }

  // Priority 3: kaspa.com marketplace (as enhancement for market data)
  try {
    const marketplaceTokens = await fetchTokensFromMarketplace();
    marketplaceTokens.forEach(token => {
      if (isValidToken(token)) {
        const key = token.symbol.toLowerCase();
        const existing = tokens.get(key);
        if (existing) {
          // Merge data, preferring marketplace data for market info
          tokens.set(key, {
            ...existing,
            ...token,
            // Prefer marketplace data for market info
            marketData: token.marketData || existing.marketData,
            // Prefer marketplace metadata (logo, description, etc.)
            logo: token.logo || existing.logo,
            description: token.description || existing.description,
            website: token.website || existing.website,
            socialLinks: token.socialLinks || existing.socialLinks,
          });
        } else {
          tokens.set(key, token);
        }
      }
    });
    results.push({ source: 'kaspa.com marketplace', success: true, tokenCount: marketplaceTokens.length });
    console.log(`✓ Fetched ${marketplaceTokens.length} tokens from kaspa.com marketplace`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.push({ source: 'kaspa.com marketplace', success: false, tokenCount: 0, error: errorMsg });
    console.warn('Failed to fetch from kaspa.com marketplace:', error);
  }

  const finalTokens = Array.from(tokens.values());
  
  // Log summary
  const successfulSources = results.filter(r => r.success).length;
  const totalTokens = results.reduce((sum, r) => sum + r.tokenCount, 0);
  console.log(`📊 Token fetch summary: ${successfulSources}/${results.length} sources succeeded, ${finalTokens.length} unique tokens found`);
  
  if (finalTokens.length === 0) {
    const errorDetails = results
      .filter(r => !r.success)
      .map(r => `${r.source}: ${r.error}`)
      .join('; ');
    throw new Error(`All API sources failed to return tokens. Errors: ${errorDetails}`);
  }

  return finalTokens;
}

/**
 * Validate token has required fields
 */
function isValidToken(token: KRC20Token): boolean {
  return !!(
    token &&
    token.symbol &&
    token.symbol.length > 0 &&
    token.symbol.length <= 10 && // KRC-20 tickers are typically short
    token.decimals !== undefined &&
    token.decimals >= 0
  );
}

/**
 * Fetch a specific token by address
 * Tries multiple sources in priority order
 */
export async function fetchTokenByAddress(address: string): Promise<KRC20Token | null> {
  // Normalize address
  const normalizedAddress = address.toLowerCase();

  // Priority 1: kas.fyi indexer
  try {
    const token = await fetchTokenByAddressFromIndexer(normalizedAddress);
    if (token && isValidToken(token)) {
      return token;
    }
  } catch (error) {
    console.debug(`Failed to fetch token ${address} from kas.fyi:`, error);
  }

  // Priority 2: kaspa.com marketplace
  try {
    const token = await fetchTokenByAddressFromMarketplace(normalizedAddress);
    if (token && isValidToken(token)) {
      return token;
    }
  } catch (error) {
    console.debug(`Failed to fetch token ${address} from marketplace:`, error);
  }

  return null;
}

/**
 * Fetch a specific token by symbol
 * Tries multiple sources in priority order
 */
export async function fetchTokenBySymbol(symbol: string): Promise<KRC20Token | null> {
  const normalizedSymbol = symbol.toUpperCase();

  // Priority 1: kas.fyi indexer
  try {
    const token = await fetchTokenBySymbolFromIndexer(normalizedSymbol);
    if (token && isValidToken(token)) {
      return token;
    }
  } catch (error) {
    console.debug(`Failed to fetch token ${symbol} from kas.fyi:`, error);
  }

  // Priority 2: kaspa.com marketplace
  try {
    const token = await fetchTokenBySymbolFromMarketplace(normalizedSymbol);
    if (token && isValidToken(token)) {
      return token;
    }
  } catch (error) {
    console.debug(`Failed to fetch token ${symbol} from marketplace:`, error);
  }

  // Priority 3: marketplace page (e.g., for KREX)
  try {
    const token = await fetchTokenFromMarketplacePage(normalizedSymbol);
    if (token && isValidToken(token)) {
      return token;
    }
  } catch (error) {
    console.debug(`Failed to fetch token ${symbol} from marketplace page:`, error);
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

