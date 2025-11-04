/**
 * Kas.fyi KRC-20 Indexer Service
 * 
 * Service for fetching KRC-20 token data via secure Next.js API routes
 * The API key is kept secure on the server-side
 * Documentation: https://docs.kas.fyi/
 */

import type { KasFyiTokenData, KRC20Token } from './types';

/**
 * Fetch all KRC-20 tokens via secure Next.js API route
 */
export async function fetchTokensFromIndexer(limit: number = 100): Promise<KRC20Token[]> {
  try {
    const response = await fetch(`/api/krc20/tokens?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch tokens: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success && Array.isArray(data.tokens)) {
      return data.tokens;
    }

    throw new Error('Invalid response format from API');
  } catch (error: any) {
    console.error('Error fetching tokens from API:', error);
    throw error;
  }
}

/**
 * Fetch a specific token by address via secure Next.js API route
 */
export async function fetchTokenByAddress(address: string): Promise<KRC20Token | null> {
  try {
    // Note: We may need to add an address endpoint to the API routes
    // For now, we'll try to fetch by symbol if address contains a symbol
    // This is a placeholder - you may want to add /api/krc20/tokens/address/[address] route
    console.warn('fetchTokenByAddress: Address lookup not yet implemented in API routes');
    return null;
  } catch (error) {
    console.error(`Error fetching token ${address}:`, error);
    return null;
  }
}

/**
 * Fetch a specific token by symbol via secure Next.js API route
 */
export async function fetchTokenBySymbol(symbol: string): Promise<KRC20Token | null> {
  try {
    const normalizedSymbol = symbol.toUpperCase();
    const response = await fetch(`/api/krc20/tokens/${encodeURIComponent(normalizedSymbol)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch token: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success && data.token) {
      return data.token;
    }

    return null;
  } catch (error: any) {
    console.error(`Error fetching token ${symbol}:`, error);
    return null;
  }
}

// Note: Token transformation is now handled in the API routes
// This file now only handles client-side API calls to our secure Next.js API routes

