/**
 * Hook for fetching lists of KRC-20 tokens
 */

import { useQuery } from '@tanstack/react-query';
import type { KRC20Token } from '@/lib/krc20/types';
import { fetchAllTokens } from '@/lib/krc20/api';

interface UseKRC20TokensOptions {
  /** Enable query (default: true) */
  enabled?: boolean;
  /** Cache time in milliseconds (default: 10 minutes) */
  staleTime?: number;
  /** Refetch interval in milliseconds (optional) */
  refetchInterval?: number;
}

/**
 * Fetch all available KRC-20 tokens
 */
export function useKRC20Tokens(options: UseKRC20TokensOptions = {}) {
  const { enabled = true, staleTime = 10 * 60 * 1000, refetchInterval } = options;

  return useQuery<KRC20Token[], Error>({
    queryKey: ['krc20-tokens'],
    queryFn: async () => {
      return await fetchAllTokens();
    },
    enabled,
    staleTime,
    refetchInterval,
    retry: 2,
    retryDelay: 1000,
  });
}

