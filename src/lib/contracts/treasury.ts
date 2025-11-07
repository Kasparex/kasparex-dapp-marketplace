'use client';

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from 'wagmi';
import { getContractAddress } from './addresses';
import { TREASURY_ABI } from './abis';
import { Address, isAddress, parseEther } from 'viem';

/**
 * Get Treasury contract address for current chain
 */
export function getTreasuryAddress(chainId: number): Address | null {
  const address = getContractAddress(chainId, 'Treasury');
  if (!address || address === '') {
    return null;
  }
  if (!isAddress(address)) {
    return null;
  }
  return address as Address;
}

/**
 * Hook to update Treasury distribution percentages
 */
export function useUpdateDistributionPercentages() {
  const chainId = useChainId();
  const contractAddress = getTreasuryAddress(chainId);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const updatePercentages = (treasuryPercentage: number, developerPercentage: number, builderPercentage: number) => {
    if (!contractAddress) {
      throw new Error('Treasury contract not deployed on this chain');
    }
    // Convert percentages to basis points (multiply by 100)
    const treasuryBP = BigInt(Math.round(treasuryPercentage * 100));
    const developerBP = BigInt(Math.round(developerPercentage * 100));
    const builderBP = BigInt(Math.round(builderPercentage * 100));

    writeContract({
      address: contractAddress,
      abi: TREASURY_ABI,
      functionName: 'setDistributionPercentages',
      args: [treasuryBP, developerBP, builderBP],
    });
  };

  return {
    updatePercentages,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook to update Treasury distribution addresses
 */
export function useUpdateDistributionAddresses() {
  const chainId = useChainId();
  const contractAddress = getTreasuryAddress(chainId);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const updateAddresses = (developerAddress: string, builderAddress: string) => {
    if (!contractAddress) {
      throw new Error('Treasury contract not deployed on this chain');
    }
    if (!isAddress(developerAddress) || !isAddress(builderAddress)) {
      throw new Error('Invalid address format');
    }

    writeContract({
      address: contractAddress,
      abi: TREASURY_ABI,
      functionName: 'setDistributionAddresses',
      args: [developerAddress as Address, builderAddress as Address],
    });
  };

  return {
    updateAddresses,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook to get Treasury distribution percentages
 */
export function useTreasuryPercentages() {
  const chainId = useChainId();
  const contractAddress = getTreasuryAddress(chainId);

  const { data: treasuryPercentage, isLoading: isLoadingTreasury } = useReadContract({
    address: contractAddress || undefined,
    abi: TREASURY_ABI,
    functionName: 'treasuryPercentage',
    query: { enabled: !!contractAddress },
  });

  const { data: developerPercentage, isLoading: isLoadingDeveloper } = useReadContract({
    address: contractAddress || undefined,
    abi: TREASURY_ABI,
    functionName: 'developerPercentage',
    query: { enabled: !!contractAddress },
  });

  const { data: builderPercentage, isLoading: isLoadingBuilder } = useReadContract({
    address: contractAddress || undefined,
    abi: TREASURY_ABI,
    functionName: 'builderPercentage',
    query: { enabled: !!contractAddress },
  });

  return {
    treasuryPercentage: treasuryPercentage ? Number(treasuryPercentage) / 100 : undefined, // Convert from basis points
    developerPercentage: developerPercentage ? Number(developerPercentage) / 100 : undefined,
    builderPercentage: builderPercentage ? Number(builderPercentage) / 100 : undefined,
    isLoading: isLoadingTreasury || isLoadingDeveloper || isLoadingBuilder,
  };
}

/**
 * Hook to get Treasury distribution addresses
 */
export function useTreasuryAddresses() {
  const chainId = useChainId();
  const contractAddress = getTreasuryAddress(chainId);

  const { data: developerAddress, isLoading: isLoadingDeveloper } = useReadContract({
    address: contractAddress || undefined,
    abi: TREASURY_ABI,
    functionName: 'developerAddress',
    query: { enabled: !!contractAddress },
  });

  const { data: builderAddress, isLoading: isLoadingBuilder } = useReadContract({
    address: contractAddress || undefined,
    abi: TREASURY_ABI,
    functionName: 'builderAddress',
    query: { enabled: !!contractAddress },
  });

  return {
    developerAddress: developerAddress as Address | undefined,
    builderAddress: builderAddress as Address | undefined,
    isLoading: isLoadingDeveloper || isLoadingBuilder,
  };
}

/**
 * Hook to get Treasury balance
 */
export function useTreasuryBalance() {
  const chainId = useChainId();
  const contractAddress = getTreasuryAddress(chainId);

  const { data, isLoading, error } = useReadContract({
    address: contractAddress || undefined,
    abi: TREASURY_ABI,
    functionName: 'getBalance',
    query: { enabled: !!contractAddress },
  });

  return {
    balance: data as bigint | undefined,
    isLoading,
    error,
  };
}

