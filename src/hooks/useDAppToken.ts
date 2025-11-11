/**
 * Hook for dApp Token Operations
 * Auto-balance updates and token operations
 */

'use client';

import { useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { DAPP_TOKEN_ABI } from '@/lib/contracts/abis';

export interface UseDAppTokenResult {
  balance: bigint | undefined;
  formattedBalance: string;
  totalSupply: bigint | undefined;
  remainingSupply: bigint | undefined;
  isLoading: boolean;
  error: Error | null;
  transfer: (to: string, amount: string) => Promise<string | null>;
  isTransferring: boolean;
  refetch: () => void;
}

/**
 * Hook for dApp token operations
 */
export function useDAppToken(tokenAddress: string | null | undefined): UseDAppTokenResult {
  const { address, isConnected } = useAccount();

  // Get balance
  const { data: balance, isLoading: isLoadingBalance, error: balanceError, refetch } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: DAPP_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!tokenAddress,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    },
  }) as { data: bigint | undefined; isLoading: boolean; error: Error | null; refetch: () => void };

  // Get total supply
  const { data: totalSupply, isLoading: isLoadingSupply } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: DAPP_TOKEN_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!tokenAddress,
      refetchInterval: 60000, // Refresh every minute
    },
  }) as { data: bigint | undefined; isLoading: boolean };

  // Get remaining supply
  const { data: remainingSupply, isLoading: isLoadingRemaining } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: DAPP_TOKEN_ABI,
    functionName: 'getRemainingSupply',
    query: {
      enabled: !!tokenAddress,
      refetchInterval: 60000,
    },
  }) as { data: bigint | undefined; isLoading: boolean };

  // Transfer function
  const { writeContract, data: transferHash, isPending: isTransferring } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: transferHash,
  });

  const transfer = async (to: string, amount: string): Promise<string | null> => {
    if (!tokenAddress || !to || !amount) return null;

    try {
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
      
      await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: DAPP_TOKEN_ABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, amountWei],
      });

      return transferHash || null;
    } catch (error) {
      console.error('Transfer failed:', error);
      return null;
    }
  };

  const formattedBalance = useMemo(() => {
    if (!balance) return '0';
    const num = Number(balance) / 1e18;
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [balance]);

  return {
    balance,
    formattedBalance,
    totalSupply,
    remainingSupply,
    isLoading: isLoadingBalance || isLoadingSupply || isLoadingRemaining,
    error: balanceError as Error | null,
    transfer,
    isTransferring: isTransferring || isConfirming,
    refetch,
  };
}

