'use client';

import { useAccount, useReadContract, useChainId } from 'wagmi';
import { LOYALTY_POINTS_ABI } from '@/lib/contracts/abis';
import { getContractAddress } from '@/lib/contracts/addresses';

export interface LoyaltyData {
  totalPoints: number;
  participationDays: number;
  lastActivity: number;
  streakDays: number;
}

export interface UseLoyaltyPointsResult {
  totalPoints: number;
  streakDays: number;
  participationDays: number;
  lastActivity: number;
  raw: LoyaltyData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Read LoyaltyPoints contract for the connected user on the current chain.
 * Returns 0 values when not connected or when contract is not deployed.
 */
export function useLoyaltyPoints(loyaltyPointsAddress?: string | null): UseLoyaltyPointsResult {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contractAddress = loyaltyPointsAddress ?? (getContractAddress(chainId, 'LoyaltyPoints') || null);

  const { data: loyaltyData, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}` | undefined,
    abi: LOYALTY_POINTS_ABI,
    functionName: 'getUserLoyalty',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!contractAddress,
      refetchInterval: 60_000,
      staleTime: 60_000,
    },
  });

  const raw: LoyaltyData | null = loyaltyData
    ? {
        totalPoints: Number(loyaltyData[0] ?? 0),
        participationDays: Number(loyaltyData[1] ?? 0),
        lastActivity: Number(loyaltyData[2] ?? 0),
        streakDays: Number(loyaltyData[3] ?? 0),
      }
    : null;

  return {
    totalPoints: raw?.totalPoints ?? 0,
    streakDays: raw?.streakDays ?? 0,
    participationDays: raw?.participationDays ?? 0,
    lastActivity: raw?.lastActivity ?? 0,
    raw: raw ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
