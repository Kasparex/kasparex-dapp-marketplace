'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TREASURY_ABI } from '@/lib/contracts/abis';
import { getContractAddress, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useChainId } from 'wagmi';

export interface RevenueData {
  totalFeesCollected: string; // In ETH/KAS
  treasuryBalance: string;
  developerShare: string;
  builderShare: string;
  treasuryShare: string;
}

/**
 * Hook to fetch revenue data from Treasury contract
 */
export function useDAppRevenue() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Get Treasury address
  const treasuryAddress = useMemo(() => {
    try {
      if (typeof getContractAddress === 'function') {
        return getContractAddress(chainId, 'Treasury') || '';
      }
    } catch (e) {
      console.warn('getContractAddress not available, using fallback');
    }

    if (CONTRACT_ADDRESSES) {
      if (chainId === 202555 && CONTRACT_ADDRESSES.kasplexL2Mainnet) {
        return CONTRACT_ADDRESSES.kasplexL2Mainnet.Treasury || '';
      } else if (chainId === 167012 && CONTRACT_ADDRESSES.kasplexL2Testnet) {
        return CONTRACT_ADDRESSES.kasplexL2Testnet.Treasury || '';
      }
    }
    return '';
  }, [chainId]);

  // Fetch Treasury data
  const { data: totalFeesCollected, isLoading: isLoadingFees } = useReadContract({
    address: treasuryAddress as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'totalFeesCollected',
    query: {
      enabled: !!treasuryAddress && isConnected,
    },
  });

  const { data: treasuryBalance, isLoading: isLoadingBalance } = useReadContract({
    address: treasuryAddress as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'getBalance',
    query: {
      enabled: !!treasuryAddress && isConnected,
    },
  });

  const { data: treasuryPercentage, isLoading: isLoadingTreasuryPct } = useReadContract({
    address: treasuryAddress as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'treasuryPercentage',
    query: {
      enabled: !!treasuryAddress && isConnected,
    },
  });

  const { data: developerPercentage, isLoading: isLoadingDevPct } = useReadContract({
    address: treasuryAddress as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'developerPercentage',
    query: {
      enabled: !!treasuryAddress && isConnected,
    },
  });

  const { data: builderPercentage, isLoading: isLoadingBuilderPct } = useReadContract({
    address: treasuryAddress as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'builderPercentage',
    query: {
      enabled: !!treasuryAddress && isConnected,
    },
  });

  const revenueData: RevenueData | null = useMemo(() => {
    if (!treasuryAddress || !isConnected) {
      return null;
    }

    const totalFees = totalFeesCollected ? formatUnits(totalFeesCollected as bigint, 18) : '0';
    const balance = treasuryBalance ? formatUnits(treasuryBalance as bigint, 18) : '0';
    
    const treasuryPct = treasuryPercentage ? Number(treasuryPercentage) : 0;
    const devPct = developerPercentage ? Number(developerPercentage) : 0;
    const builderPct = builderPercentage ? Number(builderPercentage) : 0;

    // Calculate shares based on percentages (basis points)
    const totalFeesNum = parseFloat(totalFees);
    const treasuryShare = (totalFeesNum * treasuryPct) / 10000;
    const developerShare = (totalFeesNum * devPct) / 10000;
    const builderShare = (totalFeesNum * builderPct) / 10000;

    return {
      totalFeesCollected: totalFees,
      treasuryBalance: balance,
      developerShare: developerShare.toFixed(6),
      builderShare: builderShare.toFixed(6),
      treasuryShare: treasuryShare.toFixed(6),
    };
  }, [
    treasuryAddress,
    isConnected,
    totalFeesCollected,
    treasuryBalance,
    treasuryPercentage,
    developerPercentage,
    builderPercentage,
  ]);

  return {
    data: revenueData,
    isLoading:
      isLoadingFees ||
      isLoadingBalance ||
      isLoadingTreasuryPct ||
      isLoadingDevPct ||
      isLoadingBuilderPct,
  };
}

