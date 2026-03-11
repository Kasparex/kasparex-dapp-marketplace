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
  address?: `0x${string}` | string | undefined;
}

export interface UseRevenueTreeReturn {
  tree: UnifiedRevenueTreeData | null;
  referrer: string | null;
  lifetimeVolume: bigint | null;
  volumeLast30Days: bigint | null;
  isActiveAtLevel: boolean[] | null;
  activationThreshold: bigint | null;
  baseActivityThreshold: bigint | null;
  minVolumePerCall: bigint | null;
  isLoading: boolean;
  isSupported: boolean;
  error: string | null;
}

export function useRevenueTree(options: UseRevenueTreeOptions = {}): UseRevenueTreeReturn {
  const { address: connectedAddress } = useAccount();
  const connectedChainId = useChainId();
  const chainId = options.chainId ?? connectedChainId;
  const userAddress = (options.address || connectedAddress) as `0x${string}` | undefined;

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

  // For a unified approach, we check L1 base activity as general "isActive" for simplistic views.
  // We check up to L5 via independent hooks or just load for Level 0 (L1) representing basic activity.
  const { data: isActiveL1Raw, isLoading: loadingActive } = useReadContract({
    address: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    abi: REVENUE_TREE_MANAGER_ABI,
    functionName: 'isActiveAtLevel',
    args: userAddress ? [userAddress, 0n] : undefined,
    query: { enabled: isSupported && !!userAddress },
  });

  const { data: totalReceivedRaw, isLoading: loadingTotalReceived } = useReadContract({
    address: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    abi: REVENUE_TREE_MANAGER_ABI,
    functionName: 'totalReceived',
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

  const { data: baseActivityThresholdRaw } = useReadContract({
    address: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    abi: REVENUE_TREE_MANAGER_ABI,
    functionName: 'baseActivityThreshold',
    query: { enabled: isSupported },
  });

  const { data: minVolumePerCallRaw } = useReadContract({
    address: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    abi: REVENUE_TREE_MANAGER_ABI,
    functionName: 'minVolumePerCall',
    query: { enabled: isSupported },
  });

  const isLoading =
    loadingReferrer ||
    loadingLifetime ||
    loadingActivated ||
    loadingVolume30 ||
    loadingActive ||
    loadingStatus ||
    loadingTotalReceived;

  const tree = useMemo((): UnifiedRevenueTreeData | null => {
    if (!userAddress || !isSupported) return null;
    const addr = userAddress as string;

    // Convert readonly [string, ...] array to standard array
    const uplineSnapshot = activationStatusRaw
      ? [...(activationStatusRaw[1] as readonly string[])]
      : ['', '', '', '', ''];

    const lifetimeVolume = lifetimeVolumeRaw ?? BigInt(0);
    const volumeLast30 = volumeLast30Raw ?? BigInt(0);
    const activationThreshold = activationThresholdRaw ?? BigInt(0);
    const baseActivityThreshold = baseActivityThresholdRaw ?? BigInt(0);
    const minVolPerCall = minVolumePerCallRaw ?? BigInt(0);

    const isL1Active = isActiveL1Raw ?? false;

    return {
      chainId,
      userWalletAddress: addr,
      upline: uplineSnapshot,
      lifetimeVolume: String(lifetimeVolume),
      volumeLast30Days: String(volumeLast30),
      isActiveAtLevel: [isL1Active, isL1Active, isL1Active, isL1Active, isL1Active], // Mock advanced tiers for now until multicall added
      activatedAt: activatedAtRaw && activatedAtRaw > 0n ? String(activatedAtRaw) : null,
      referralLink: getUniversalReferralLink(addr),
      totalEarned: String(totalReceivedRaw ?? BigInt(0)),
      referrerSet: referrerOf != null && referrerOf !== '0x0000000000000000000000000000000000000000',
      referrer: referrerOf && referrerOf !== '0x0000000000000000000000000000000000000000' ? (referrerOf as string) : null,
      activationThreshold: String(activationThreshold),
      baseActivityThreshold: String(baseActivityThreshold),
      minVolumePerCall: String(minVolPerCall),
    };
  }, [
    userAddress,
    isSupported,
    chainId,
    referrerOf,
    lifetimeVolumeRaw,
    volumeLast30Raw,
    isActiveL1Raw,
    totalReceivedRaw,
    activatedAtRaw,
    activationStatusRaw,
    activationThresholdRaw,
    baseActivityThresholdRaw,
    minVolumePerCallRaw
  ]);

  return {
    tree,
    referrer: referrerOf && referrerOf !== '0x0000000000000000000000000000000000000000' ? (referrerOf as string) : null,
    lifetimeVolume: lifetimeVolumeRaw ?? null,
    volumeLast30Days: volumeLast30Raw ?? null,
    isActiveAtLevel: tree?.isActiveAtLevel ?? null,
    activationThreshold: activationThresholdRaw ?? null,
    baseActivityThreshold: baseActivityThresholdRaw ?? null,
    minVolumePerCall: minVolumePerCallRaw ?? null,
    isLoading,
    isSupported,
    error: null,
  };
}
