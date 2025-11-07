'use client';

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from 'wagmi';
import { getContractAddress } from './addresses';
import { AUTHORIZATION_REGISTRY_ABI } from './abis';
import { Address, isAddress } from 'viem';

/**
 * Get AuthorizationRegistry contract address for current chain
 */
export function getAuthorizationRegistryAddress(chainId: number): Address | null {
  const address = getContractAddress(chainId, 'AuthorizationRegistry');
  if (!address || address === '') {
    return null;
  }
  if (!isAddress(address)) {
    return null;
  }
  return address as Address;
}

/**
 * Hook to assign a developer to a dApp
 */
export function useAssignDeveloper() {
  const chainId = useChainId();
  const contractAddress = getAuthorizationRegistryAddress(chainId);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const assignDeveloper = (dAppId: number, developerAddress: string) => {
    if (!contractAddress) {
      throw new Error('AuthorizationRegistry contract not deployed on this chain');
    }
    if (!isAddress(developerAddress)) {
      throw new Error('Invalid developer address');
    }

    writeContract({
      address: contractAddress,
      abi: AUTHORIZATION_REGISTRY_ABI,
      functionName: 'assignDeveloper',
      args: [BigInt(dAppId), developerAddress as Address],
    });
  };

  return {
    assignDeveloper,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook to revoke a developer from a dApp
 */
export function useRevokeDeveloper() {
  const chainId = useChainId();
  const contractAddress = getAuthorizationRegistryAddress(chainId);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const revokeDeveloper = (dAppId: number, developerAddress: string) => {
    if (!contractAddress) {
      throw new Error('AuthorizationRegistry contract not deployed on this chain');
    }
    if (!isAddress(developerAddress)) {
      throw new Error('Invalid developer address');
    }

    writeContract({
      address: contractAddress,
      abi: AUTHORIZATION_REGISTRY_ABI,
      functionName: 'revokeDeveloper',
      args: [BigInt(dAppId), developerAddress as Address],
    });
  };

  return {
    revokeDeveloper,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook to check if an address is a developer for a dApp
 */
export function useIsDeveloper(dAppId: number | undefined, developerAddress: string | undefined) {
  const chainId = useChainId();
  const contractAddress = getAuthorizationRegistryAddress(chainId);

  // Guard against SSR
  const isClient = typeof window !== 'undefined';

  const { data, isLoading, error } = useReadContract({
    address: contractAddress || undefined,
    abi: AUTHORIZATION_REGISTRY_ABI,
    functionName: 'isDeveloper',
    args: dAppId !== undefined && developerAddress && isAddress(developerAddress)
      ? [BigInt(dAppId), developerAddress as Address]
      : undefined,
    query: {
      enabled: isClient && !!contractAddress && dAppId !== undefined && !!developerAddress && isAddress(developerAddress),
    },
  });

  return {
    isDeveloper: data as boolean | undefined,
    isLoading: !isClient ? true : isLoading,
    error,
  };
}

/**
 * Hook to get all developers for a dApp
 */
export function useDAppDevelopers(dAppId: number | undefined) {
  const chainId = useChainId();
  const contractAddress = getAuthorizationRegistryAddress(chainId);

  // Guard against SSR
  const isClient = typeof window !== 'undefined';

  const { data, isLoading, error } = useReadContract({
    address: contractAddress || undefined,
    abi: AUTHORIZATION_REGISTRY_ABI,
    functionName: 'getDAppDevelopers',
    args: dAppId !== undefined ? [BigInt(dAppId)] : undefined,
    query: {
      enabled: isClient && !!contractAddress && dAppId !== undefined,
    },
  });

  return {
    developers: data as Address[] | undefined,
    isLoading: !isClient ? true : isLoading,
    error,
  };
}

/**
 * Hook to get all dApp IDs where an address is a developer
 */
export const useDeveloperDApps = (developerAddress: string | undefined) => {
  const chainId = useChainId();
  const contractAddress = getAuthorizationRegistryAddress(chainId);

  // Guard against SSR - check if we're on client side
  const isClient = typeof window !== 'undefined';

  const { data, isLoading, error } = useReadContract({
    address: contractAddress || undefined,
    abi: AUTHORIZATION_REGISTRY_ABI,
    functionName: 'getDeveloperDApps',
    args: developerAddress && isAddress(developerAddress) ? [developerAddress as Address] : undefined,
    query: {
      // Only enable query on client side and when all conditions are met
      enabled: isClient && !!contractAddress && !!developerAddress && isAddress(developerAddress),
    },
  });

  return {
    dAppIds: data as bigint[] | undefined,
    isLoading: !isClient ? true : isLoading,
    error,
  };
};

