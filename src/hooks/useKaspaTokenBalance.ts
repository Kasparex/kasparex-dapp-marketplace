/**
 * Hook for KRC20 Token Balance (L1)
 * Fetches token balance from Kaspa L1 using Kasplex Indexer API
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';

const KASPLEX_INDEXER_API_BASE = 'https://api.kasplex.org';

/**
 * Normalize Kaspa address (remove kaspa: prefix if present)
 */
function normalizeKaspaAddress(address: string): string {
  if (!address) return '';
  return address.replace(/^kaspa:/i, '').trim();
}

/**
 * Get API URL - use proxy in browser, direct API on server
 */
function getApiUrl(endpoint: string): string {
  if (typeof window !== 'undefined') {
    return `/api/kasplex-indexer?endpoint=${encodeURIComponent(endpoint)}`;
  }
  return `${KASPLEX_INDEXER_API_BASE}${endpoint}`;
}

export interface UseKaspaTokenBalanceResult {
  balance: number;
  formattedBalance: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch KRC20 token balance from Kaspa L1
 */
export function useKaspaTokenBalance(
  ticker: string | null | undefined
): UseKaspaTokenBalanceResult {
  const { state: kaspaState } = useKaspaWallet();
  const address = kaspaState.address;

  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address || !ticker) {
      setBalance(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try KasWare when it is the active L1 connection (avoid wrong balance if both extensions exist)
      if (typeof window !== 'undefined' && kaspaState.provider === 'kasware') {
        const win = window as any;
        if (
          win.kasware &&
          typeof win.kasware.getKRC20Balance === 'function' &&
          (typeof win.kasware.isConnected !== 'function' || win.kasware.isConnected())
        ) {
          try {
            const tokens = await win.kasware.getKRC20Balance();
            if (tokens && Array.isArray(tokens)) {
              const token = tokens.find(
                (t: any) => t.tick?.toUpperCase() === ticker.toUpperCase()
              );
              if (token) {
                const rawBalance = token.balance ?? token.amount;
                const decimals = token.dec !== undefined ? Number(token.dec) : 8;
                const rawBalanceNum =
                  typeof rawBalance === 'string' ? parseFloat(rawBalance) : Number(rawBalance);
                if (!isNaN(rawBalanceNum)) {
                  const balanceValue = rawBalanceNum / Math.pow(10, decimals);
                  setBalance(balanceValue);
                  setIsLoading(false);
                  return;
                }
              }
            }
          } catch (err) {
            console.warn('KasWare balance check failed, trying API:', err);
          }
        }
      }

      // Fallback to API
      const normalizedAddress = normalizeKaspaAddress(address);
      const endpoint = `/v1/krc20/address/${encodeURIComponent(normalizedAddress)}/token/${ticker.toUpperCase()}`;
      const apiUrl = getApiUrl(endpoint);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setBalance(0);
          setIsLoading(false);
          return;
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const balanceValue =
        data.balance !== undefined
          ? typeof data.balance === 'string'
            ? parseFloat(data.balance)
            : Number(data.balance)
          : data.amount !== undefined
            ? typeof data.amount === 'string'
              ? parseFloat(data.amount)
              : Number(data.amount)
            : 0;

      if (isNaN(balanceValue)) {
        throw new Error('Invalid balance format in response');
      }

      setBalance(balanceValue);
    } catch (err) {
      console.error('Error fetching Kaspa token balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [address, ticker, kaspaState.provider]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const formattedBalance = balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });

  return {
    balance,
    formattedBalance,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}
