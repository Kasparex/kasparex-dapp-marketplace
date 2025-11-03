/**
 * Hook for fetching a single KRC-20 token
 */

import { useQuery } from '@tanstack/react-query';
import type { KRC20Token } from '@/lib/krc20/types';
import { fetchTokenByAddress, fetchTokenBySymbol } from '@/lib/krc20/api';

interface UseKRC20TokenOptions {
  /** Token address to fetch */
  address?: string;
  /** Token symbol to fetch */
  symbol?: string;
  /** Enable query (default: true) */
  enabled?: boolean;
  /** Cache time in milliseconds (default: 5 minutes) */
  staleTime?: number;
}

/**
 * Fetch a single KRC-20 token by address or symbol
 */
export function useKRC20Token(options: UseKRC20TokenOptions = {}) {
  const { address, symbol, enabled = true, staleTime = 5 * 60 * 1000 } = options;

  return useQuery<KRC20Token | null, Error>({
    queryKey: ['krc20-token', address || symbol],
    queryFn: async () => {
      if (address) {
        return await fetchTokenByAddress(address);
      }
      if (symbol) {
        return await fetchTokenBySymbol(symbol);
      }
      return null;
    },
    enabled: enabled && (!!address || !!symbol),
    staleTime,
    retry: 2,
    retryDelay: 1000,
  });
}

