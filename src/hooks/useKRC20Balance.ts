/**
 * Hook for fetching KRC-20 token balances for an address
 */

import { useQuery } from '@tanstack/react-query';
import type { KRC20Balance } from '@/lib/krc20/types';
import { fetchTokenBalances, isValidKaspaAddress } from '@/lib/krc20/api';

interface UseKRC20BalanceOptions {
  /** Kaspa address to fetch balances for */
  address?: string;
  /** Enable query (default: true) */
  enabled?: boolean;
  /** Cache time in milliseconds (default: 1 minute) */
  staleTime?: number;
  /** Refetch interval in milliseconds (default: 30 seconds) */
  refetchInterval?: number;
}

/**
 * Fetch KRC-20 token balances for a given address
 */
export function useKRC20Balance(options: UseKRC20BalanceOptions = {}) {
  const { 
    address, 
    enabled = true, 
    staleTime = 1 * 60 * 1000,
    refetchInterval = 30 * 1000 
  } = options;

  const isValidAddress = address ? isValidKaspaAddress(address) : false;

  return useQuery<KRC20Balance[], Error>({
    queryKey: ['krc20-balances', address],
    queryFn: async () => {
      if (!address || !isValidAddress) {
        return [];
      }
      return await fetchTokenBalances(address);
    },
    enabled: enabled && isValidAddress,
    staleTime,
    refetchInterval,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Hook for fetching balance of a specific token for an address
 */
export function useKRC20TokenBalance(
  address?: string,
  tokenAddress?: string,
  options: Omit<UseKRC20BalanceOptions, 'address'> = {}
) {
  const { 
    enabled = true, 
    staleTime = 1 * 60 * 1000,
    refetchInterval = 30 * 1000 
  } = options;

  const balances = useKRC20Balance({ address, enabled, staleTime, refetchInterval });

  return {
    ...balances,
    data: balances.data?.find(balance => 
      balance.tokenAddress.toLowerCase() === tokenAddress?.toLowerCase()
    ),
  };
}

