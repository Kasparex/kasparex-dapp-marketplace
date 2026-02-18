'use client';

import { useMemo } from 'react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { REVENUE_TREE_MANAGER_ABI } from '@/lib/contracts/abis';
import { getUniversalReferralLink } from '@/lib/revenue-tree/referral';
import type { UnifiedRevenueTreeData } from '@/lib/revenue-tree/types';

export interface UseRevenueTreeOptions {
  /** Chain ID for the contract. Defaults to connected chain. */
  chainId?: number;
  /** User address to query. Defaults to connected account. */
  userAddress?: `0x${string}` | undefined;
}

export interface UseRevenueTreeReturn {
  /** Unified tree data when contract is available and data loaded. */
  tree: UnifiedRevenueTreeData | null;
  /** Raw referrer address (on-chain). */
  referrer: string | null;
  /** Lifetime volume (wei string). */
  lifetimeVolume: bigint | null;
  /** Volume in last 30 days (wei string). */
  volumeLast30Days: bigint | null;
  /** Whether user is active (maintenance). */
  isActive: boolean | null;
  /** Activation threshold from contract (wei). */
  activationThreshold: bigint | null;
  /** Activity threshold from contract (wei). */
  activityThreshold: bigint | null;
  /** Whether any contract read is still loading. */
  isLoading: boolean;
  /** Whether RevenueTreeManager is deployed on this chain. */
  isSupported: boolean;
  /** Error from contract reads. */
  error: string | null;
}

export function useRevenueTree(options: UseRevenueTreeOptions = {}): UseRevenueTreeReturn {
  const { address: connectedAddress } = useAccount();
  const connectedChainId = useChainId();
  const chainId = options.chainId ?? connectedChainId;
  const userAddress = options.userAddress ?? connectedAddress ?? undefined;

  const contractAddress = getContractAddress(chainId, 'RevenueTreeManager');
  const isSupported = !!contractAddress && contractAddress.length > 0;

  const { data: referrerOf, isLoading: loadingReferrer } = useReadContract({
    address: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    abi: REVENUE_TREE_MANAGER_ABI,
    functionName: 'referrerOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: isSupported && !!userAddress },
  });

  const { data: lifetimeVolumeRaw, isLoading: loadingLifetime } = useReadContract({
    address: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    abi: REVENUE_TREE_MANAGER_ABI,
    functionName: 'lifetimeVolume',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: isSupported && !!userAddress },
  });

  const { data: activatedAtRaw, isLoading: loadingActivated } = useReadContract({
    address: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    abi: REVENUE_TREE_MANAGER_ABI,
    functionName: 'activatedAt',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: isSupported && !!userAddress },
  });

  const { data: volumeLast30Raw, isLoading: loadingVolume30 } = useReadContract({
    address: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    abi: REVENUE_TREE_MANAGER_ABI,
    functionName: 'getVolumeLast30Days',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: isSupported && !!userAddress },
  });

  const { data: isActiveRaw, isLoading: loadingActive } = useReadContract({
    address: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    abi: REVENUE_TREE_MANAGER_ABI,
    functionName: 'isActive',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: isSupported && !!userAddress },
  });

  const { data: activationStatusRaw, isLoading: loadingStatus } = useReadContract({
    address: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    abi: REVENUE_TREE_MANAGER_ABI,
    functionName: 'getActivationStatus',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: isSupported && !!userAddress },
  });

  const { data: activationThresholdRaw } = useReadContract({
    address: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    abi: REVENUE_TREE_MANAGER_ABI,
    functionName: 'activationThreshold',
    query: { enabled: isSupported },
  });

  const { data: activityThresholdRaw } = useReadContract({
    address: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    abi: REVENUE_TREE_MANAGER_ABI,
    functionName: 'activityThreshold',
    query: { enabled: isSupported },
  });

  const isLoading =
    loadingReferrer ||
    loadingLifetime ||
    loadingActivated ||
    loadingVolume30 ||
    loadingActive ||
    loadingStatus;

  const tree = useMemo((): UnifiedRevenueTreeData | null => {
    if (!userAddress || !isSupported) return null;
    const addr = userAddress as string;
    const uplineSnapshot = activationStatusRaw
      ? (activationStatusRaw[1] as readonly [string, string, string, string, string])
      : (['', '', '', '', ''] as const);
    const activated = activationStatusRaw ? activationStatusRaw[0] : false;
    const lifetimeVolume = lifetimeVolumeRaw ?? BigInt(0);
    const volumeLast30 = volumeLast30Raw ?? BigInt(0);
    const activationThreshold = activationThresholdRaw ?? BigInt(0);
    const activityThreshold = activityThresholdRaw ?? BigInt(0);
    return {
      chainId,
      userWalletAddress: addr,
      upline: [...uplineSnapshot],
      lifetimeVolume: String(lifetimeVolume),
      volumeLast30Days: String(volumeLast30),
      isActive: isActiveRaw ?? false,
      activatedAt: activatedAtRaw && activatedAtRaw > 0n ? String(activatedAtRaw) : null,
      referralLink: getUniversalReferralLink(addr),
      totalEarned: '0', // from events/indexer later
      referrerSet: referrerOf != null && referrerOf !== '0x0000000000000000000000000000000000000000',
      referrer: referrerOf && referrerOf !== '0x0000000000000000000000000000000000000000' ? referrerOf : null,
      activationThreshold: String(activationThreshold),
      activityThreshold: String(activityThreshold),
    };
  }, [
    userAddress,
    isSupported,
    chainId,
    referrerOf,
    lifetimeVolumeRaw,
    volumeLast30Raw,
    isActiveRaw,
    activatedAtRaw,
    activationStatusRaw,
    activationThresholdRaw,
    activityThresholdRaw,
  ]);

  return {
    tree,
    referrer: referrerOf && referrerOf !== '0x0000000000000000000000000000000000000000' ? referrerOf : null,
    lifetimeVolume: lifetimeVolumeRaw ?? null,
    volumeLast30Days: volumeLast30Raw ?? null,
    isActive: isActiveRaw ?? null,
    activationThreshold: activationThresholdRaw ?? null,
    activityThreshold: activityThresholdRaw ?? null,
    isLoading,
    isSupported,
    error: null,
  };
}
