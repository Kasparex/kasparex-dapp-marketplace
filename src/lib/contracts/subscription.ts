'use client';

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from 'wagmi';
import { getContractAddress } from './addresses';
import { DAPP_SUBSCRIPTION_ABI } from './abis';
import { Address, isAddress, parseEther } from 'viem';

/**
 * Get DAppSubscription contract address for current chain
 */
export function getDAppSubscriptionAddress(chainId: number): Address | null {
  const address = getContractAddress(chainId, 'DAppSubscription');
  if (!address || address === '') {
    return null;
  }
  if (!isAddress(address)) {
    return null;
  }
  return address as Address;
}

/**
 * Hook to update Kasparex fee percentage
 */
export function useUpdateKasparexFee() {
  const chainId = useChainId();
  const contractAddress = getDAppSubscriptionAddress(chainId);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const updateFee = (feePercentage: number) => {
    if (!contractAddress) {
      throw new Error('DAppSubscription contract not deployed on this chain');
    }
    // Convert percentage to basis points (multiply by 100)
    const feeBP = BigInt(Math.round(feePercentage * 100));

    writeContract({
      address: contractAddress,
      abi: DAPP_SUBSCRIPTION_ABI,
      functionName: 'setKasparexFeePercentage',
      args: [feeBP],
    });
  };

  return {
    updateFee,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook to get Kasparex fee percentage
 */
export function useKasparexFee() {
  const chainId = useChainId();
  const contractAddress = getDAppSubscriptionAddress(chainId);

  const { data, isLoading, error } = useReadContract({
    address: contractAddress || undefined,
    abi: DAPP_SUBSCRIPTION_ABI,
    functionName: 'kasparexFeePercentage',
    query: { enabled: !!contractAddress },
  });

  return {
    feePercentage: data ? Number(data) / 100 : undefined, // Convert from basis points
    isLoading,
    error,
  };
}

/**
 * Hook to create or update subscription plan for a dApp
 */
export function useUpdateSubscriptionPlan() {
  const chainId = useChainId();
  const contractAddress = getDAppSubscriptionAddress(chainId);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const updatePlan = (
    dAppContract: string,
    monthlyPrice: string,
    quarterlyPrice: string,
    yearlyPrice: string,
    isUpdate: boolean = false
  ) => {
    if (!contractAddress) {
      throw new Error('DAppSubscription contract not deployed on this chain');
    }
    if (!isAddress(dAppContract)) {
      throw new Error('Invalid dApp contract address');
    }

    const monthlyWei = parseEther(monthlyPrice);
    const quarterlyWei = parseEther(quarterlyPrice);
    const yearlyWei = parseEther(yearlyPrice);

    const functionName = isUpdate ? 'updateSubscriptionPlan' : 'createSubscriptionPlan';

    writeContract({
      address: contractAddress,
      abi: DAPP_SUBSCRIPTION_ABI,
      functionName: functionName as any,
      args: [dAppContract as Address, monthlyWei, quarterlyWei, yearlyWei],
    });
  };

  return {
    updatePlan,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook to get subscription plan for a dApp
 */
export function useSubscriptionPlan(dAppContract: string | undefined) {
  const chainId = useChainId();
  const contractAddress = getDAppSubscriptionAddress(chainId);

  const { data, isLoading, error } = useReadContract({
    address: contractAddress || undefined,
    abi: DAPP_SUBSCRIPTION_ABI,
    functionName: 'getSubscriptionPlan',
    args: dAppContract && isAddress(dAppContract) ? [dAppContract as Address] : undefined,
    query: {
      enabled: !!contractAddress && !!dAppContract && isAddress(dAppContract),
    },
  });

  // Data structure: (address dAppContract, address developer, uint256 monthlyPrice, uint256 quarterlyPrice, uint256 yearlyPrice, bool isActive, uint256 createdAt)
  const plan = data as [Address, Address, bigint, bigint, bigint, boolean, bigint] | undefined;

  return {
    plan: plan ? {
      dAppContract: plan[0],
      developer: plan[1],
      monthlyPrice: plan[2],
      quarterlyPrice: plan[3],
      yearlyPrice: plan[4],
      isActive: plan[5],
      createdAt: plan[6],
    } : undefined,
    isLoading,
    error,
  };
}

