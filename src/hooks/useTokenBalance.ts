/**
 * Hook for ERC20 Token Balance (L2)
 * Fetches token balance from EVM-compatible chains
 */

'use client';

import { useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';

// Standard ERC-20 ABI (only balanceOf and decimals)
const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface UseTokenBalanceResult {
  balance: bigint | undefined;
  formattedBalance: string;
  balanceNumber: number;
  decimals: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch ERC20 token balance
 */
export function useTokenBalance(
  tokenAddress: string | null | undefined,
  chainId?: number
): UseTokenBalanceResult {
  const { address, isConnected } = useAccount();

  // Get decimals
  const { data: decimalsData, isLoading: isLoadingDecimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
    },
  }) as { data: number | undefined; isLoading: boolean };

  const decimals = decimalsData ?? 18; // Default to 18 if not available

  // Get balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
    error: balanceError,
    refetch,
  } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!tokenAddress,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    },
  }) as { data: bigint | undefined; isLoading: boolean; error: Error | null; refetch: () => void };

  const formattedBalance = useMemo(() => {
    if (!balance) return '0';
    try {
      return formatUnits(balance, decimals);
    } catch {
      return '0';
    }
  }, [balance, decimals]);

  const balanceNumber = useMemo(() => {
    if (!balance) return 0;
    try {
      return parseFloat(formatUnits(balance, decimals));
    } catch {
      return 0;
    }
  }, [balance, decimals]);

  return {
    balance,
    formattedBalance,
    balanceNumber,
    decimals,
    isLoading: isLoadingBalance || isLoadingDecimals,
    error: balanceError as Error | null,
    refetch,
  };
}
