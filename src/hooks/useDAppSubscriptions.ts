'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { DAPP_SUBSCRIPTION_ABI } from '@/lib/contracts/abis';
import { getContractAddress, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useChainId } from 'wagmi';

export interface SubscriptionPlan {
  dAppContract: string;
  developer: string;
  monthlyPrice: string;
  quarterlyPrice: string;
  yearlyPrice: string;
  isActive: boolean;
  createdAt: Date;
}

export interface UserSubscription {
  dAppContract: string;
  isSubscribed: boolean;
  expiryTimestamp: Date | null;
  frequency: 'Monthly' | 'Quarterly' | 'Yearly' | null;
}

/**
 * Hook to fetch subscription plan for a specific dApp contract
 */
export function useDAppSubscriptionPlan(dAppContractAddress: string | undefined) {
  const chainId = useChainId();

  // Get DAppSubscription address
  const dAppSubscriptionAddress = useMemo(() => {
    try {
      if (typeof getContractAddress === 'function') {
        return getContractAddress(chainId, 'DAppSubscription') || '';
      }
    } catch (e) {
      console.warn('getContractAddress not available, using fallback');
    }

    if (CONTRACT_ADDRESSES) {
      if (chainId === 202555 && CONTRACT_ADDRESSES.kasplexL2Mainnet) {
        return CONTRACT_ADDRESSES.kasplexL2Mainnet.DAppSubscription || '';
      } else if (chainId === 167012 && CONTRACT_ADDRESSES.kasplexL2Testnet) {
        return CONTRACT_ADDRESSES.kasplexL2Testnet.DAppSubscription || '';
      }
    }
    return '';
  }, [chainId]);

  const { data: planData, isLoading } = useReadContract({
    address: dAppSubscriptionAddress as `0x${string}`,
    abi: DAPP_SUBSCRIPTION_ABI,
    functionName: 'getSubscriptionPlan',
    args: dAppContractAddress ? [dAppContractAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!dAppSubscriptionAddress && !!dAppContractAddress && dAppContractAddress.startsWith('0x'),
    },
  });

  const plan: SubscriptionPlan | null = useMemo(() => {
    if (!planData || !Array.isArray(planData) || planData.length < 7) {
      return null;
    }

    return {
      dAppContract: planData[0] as string,
      developer: planData[1] as string,
      monthlyPrice: formatUnits(planData[2] as bigint, 18),
      quarterlyPrice: formatUnits(planData[3] as bigint, 18),
      yearlyPrice: formatUnits(planData[4] as bigint, 18),
      isActive: planData[5] as boolean,
      createdAt: new Date(Number(planData[6] as bigint) * 1000),
    };
  }, [planData]);

  return {
    plan,
    isLoading,
  };
}

/**
 * Hook to check user's subscription status for a dApp
 */
export function useDAppUserSubscription(dAppContractAddress: string | undefined) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Get DAppSubscription address
  const dAppSubscriptionAddress = useMemo(() => {
    try {
      if (typeof getContractAddress === 'function') {
        return getContractAddress(chainId, 'DAppSubscription') || '';
      }
    } catch (e) {
      console.warn('getContractAddress not available, using fallback');
    }

    if (CONTRACT_ADDRESSES) {
      if (chainId === 202555 && CONTRACT_ADDRESSES.kasplexL2Mainnet) {
        return CONTRACT_ADDRESSES.kasplexL2Mainnet.DAppSubscription || '';
      } else if (chainId === 167012 && CONTRACT_ADDRESSES.kasplexL2Testnet) {
        return CONTRACT_ADDRESSES.kasplexL2Testnet.DAppSubscription || '';
      }
    }
    return '';
  }, [chainId]);

  const { data: isSubscribed, isLoading: isLoadingSubscribed } = useReadContract({
    address: dAppSubscriptionAddress as `0x${string}`,
    abi: DAPP_SUBSCRIPTION_ABI,
    functionName: 'isSubscribed',
    args:
      address && dAppContractAddress
        ? [address as `0x${string}`, dAppContractAddress as `0x${string}`]
        : undefined,
    query: {
      enabled:
        !!dAppSubscriptionAddress &&
        !!address &&
        !!dAppContractAddress &&
        isConnected &&
        dAppContractAddress.startsWith('0x'),
    },
  });

  const { data: expiryTimestamp, isLoading: isLoadingExpiry } = useReadContract({
    address: dAppSubscriptionAddress as `0x${string}`,
    abi: DAPP_SUBSCRIPTION_ABI,
    functionName: 'getExpiryTimestamp',
    args:
      address && dAppContractAddress
        ? [address as `0x${string}`, dAppContractAddress as `0x${string}`]
        : undefined,
    query: {
      enabled:
        !!dAppSubscriptionAddress &&
        !!address &&
        !!dAppContractAddress &&
        isConnected &&
        dAppContractAddress.startsWith('0x'),
    },
  });

  const subscription: UserSubscription | null = useMemo(() => {
    if (!isConnected || !address || !dAppContractAddress) {
      return null;
    }

    return {
      dAppContract: dAppContractAddress,
      isSubscribed: isSubscribed as boolean || false,
      expiryTimestamp: expiryTimestamp ? new Date(Number(expiryTimestamp as bigint) * 1000) : null,
      frequency: null, // Would need additional contract call to get frequency
    };
  }, [isConnected, address, dAppContractAddress, isSubscribed, expiryTimestamp]);

  return {
    subscription,
    isLoading: isLoadingSubscribed || isLoadingExpiry,
  };
}

