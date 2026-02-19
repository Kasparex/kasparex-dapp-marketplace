/**
 * Hook for GRID Token Operations
 * Auto-refresh GRID token balance and operations
 */

'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { GRID_TOKEN_ABI } from '@/lib/contracts/abis';
import { useMemo } from 'react';

export interface UseGRIDTokenResult {
  balance: bigint | undefined;
  formattedBalance: string;
  totalSupply: bigint | undefined;
  totalBurned: bigint | undefined;
  circulatingSupply: bigint | undefined;
  burnPercentage: number;
  isLoading: boolean;
  error: Error | null;
  burn: (amount: string) => Promise<string | null>;
  isBurning: boolean;
  refetch: () => void;
}

/**
 * Hook for GRID token operations
 */
export function useGRIDToken(gridTokenAddress: string | null | undefined): UseGRIDTokenResult {
  const { address, isConnected } = useAccount();

  // Get balance
  const { data: balance, isLoading: isLoadingBalance, error: balanceError, refetch } = useReadContract({
    address: gridTokenAddress as `0x${string}`,
    abi: GRID_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!gridTokenAddress,
      refetchInterval: 60000,
      staleTime: 60_000,
    },
  }) as { data: bigint | undefined; isLoading: boolean; error: Error | null; refetch: () => void };

  // Get total supply
  const { data: totalSupply, isLoading: isLoadingSupply } = useReadContract({
    address: gridTokenAddress as `0x${string}`,
    abi: GRID_TOKEN_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!gridTokenAddress,
      refetchInterval: 60000,
    },
  }) as { data: bigint | undefined; isLoading: boolean };

  // Get total burned
  const { data: totalBurned, isLoading: isLoadingBurned } = useReadContract({
    address: gridTokenAddress as `0x${string}`,
    abi: GRID_TOKEN_ABI,
    functionName: 'totalBurned',
    query: {
      enabled: !!gridTokenAddress,
      refetchInterval: 60000,
    },
  }) as { data: bigint | undefined; isLoading: boolean };

  // Get circulating supply
  const { data: circulatingSupply, isLoading: isLoadingCirculating } = useReadContract({
    address: gridTokenAddress as `0x${string}`,
    abi: GRID_TOKEN_ABI,
    functionName: 'circulatingSupply',
    query: {
      enabled: !!gridTokenAddress,
      refetchInterval: 60000,
    },
  }) as { data: bigint | undefined; isLoading: boolean };

  // Get burn percentage
  const { data: burnPercentageBP } = useReadContract({
    address: gridTokenAddress as `0x${string}`,
    abi: GRID_TOKEN_ABI,
    functionName: 'burnPercentage',
    query: {
      enabled: !!gridTokenAddress,
      refetchInterval: 60000,
    },
  }) as { data: bigint | undefined };

  // Burn function
  const { writeContract, data: burnHash, isPending: isBurning } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: burnHash,
  });

  const burn = async (amount: string): Promise<string | null> => {
    if (!gridTokenAddress || !amount) return null;

    try {
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
      
      await writeContract({
        address: gridTokenAddress as `0x${string}`,
        abi: GRID_TOKEN_ABI,
        functionName: 'burn',
        args: [amountWei],
      });

      return burnHash || null;
    } catch (error) {
      console.error('Burn failed:', error);
      return null;
    }
  };

  const formattedBalance = useMemo(() => {
    if (!balance) return '0';
    const num = Number(balance) / 1e18;
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [balance]);

  const burnPercentage = useMemo(() => {
    if (!burnPercentageBP) return 0;
    return Number(burnPercentageBP) / 100; // Convert from basis points to percentage
  }, [burnPercentageBP]);

  return {
    balance,
    formattedBalance,
    totalSupply,
    totalBurned,
    circulatingSupply,
    burnPercentage,
    isLoading: isLoadingBalance || isLoadingSupply || isLoadingBurned || isLoadingCirculating,
    error: balanceError as Error | null,
    burn,
    isBurning: isBurning || isConfirming,
    refetch,
  };
}

