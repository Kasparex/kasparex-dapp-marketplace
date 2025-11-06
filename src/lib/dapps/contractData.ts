'use client';

import { useEffect } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { DAPP_REGISTRY_ABI } from '@/lib/contracts/abis';
import { getContractAddress, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { DApp } from '@/lib/dapps';

export interface ContractDAppData {
  name: string;
  version: string;
  category: string;
  contractAddress: string;
  deployerAddress: string;
  isActive: boolean;
  registeredAt: bigint;
  tokenAddress: string | null;
}

/**
 * Fetch dApp data from DAppRegistry contract
 */
export function useDAppFromContract(contractAddress: string | undefined, chainId: number | undefined) {
  const publicClient = usePublicClient();

  // Get DAppRegistry address
  let dAppRegistryAddress = '';
  try {
    if (typeof getContractAddress === 'function') {
      dAppRegistryAddress = getContractAddress(chainId || 0, 'DAppRegistry') || '';
    }
  } catch (e) {
    console.warn('getContractAddress not available, using fallback');
  }

  if (!dAppRegistryAddress && CONTRACT_ADDRESSES) {
    if (chainId === 202555 && CONTRACT_ADDRESSES.kasplexL2Mainnet) {
      dAppRegistryAddress = CONTRACT_ADDRESSES.kasplexL2Mainnet.DAppRegistry || '';
    } else if (chainId === 167012 && CONTRACT_ADDRESSES.kasplexL2Testnet) {
      dAppRegistryAddress = CONTRACT_ADDRESSES.kasplexL2Testnet.DAppRegistry || '';
    }
  }

  // First, get dAppId from contract address
  const { data: dAppId, isLoading: isLoadingId, refetch: refetchDAppId } = useReadContract({
    address: dAppRegistryAddress as `0x${string}`,
    abi: DAPP_REGISTRY_ABI,
    functionName: 'getDAppIdByContract',
    args: contractAddress ? [contractAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!dAppRegistryAddress && !!contractAddress && !!chainId && contractAddress.startsWith('0x'),
      refetchInterval: 30000, // Poll every 30 seconds for version updates
    },
  });

  // Then, get dApp data using dAppId
  const { data: dAppData, isLoading: isLoadingData, refetch: refetchDAppData } = useReadContract({
    address: dAppRegistryAddress as `0x${string}`,
    abi: DAPP_REGISTRY_ABI,
    functionName: 'getDApp',
    args: dAppId ? [dAppId as bigint] : undefined,
    query: {
      enabled: !!dAppRegistryAddress && !!dAppId && !!chainId,
      refetchInterval: 30000, // Poll every 30 seconds for version updates
    },
  });

  // Periodic polling effect - refetch every 30 seconds
  useEffect(() => {
    if (!dAppRegistryAddress || !contractAddress || !chainId || !contractAddress.startsWith('0x')) {
      return;
    }

    const interval = setInterval(() => {
      refetchDAppId();
      if (dAppId) {
        refetchDAppData();
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [dAppRegistryAddress, contractAddress, chainId, dAppId, refetchDAppId, refetchDAppData]);

  // Parse the tuple response
  let parsedData: ContractDAppData | null = null;
  if (dAppData && Array.isArray(dAppData) && dAppData.length >= 8) {
    parsedData = {
      name: dAppData[0] as string,
      version: dAppData[1] as string,
      category: dAppData[2] as string,
      contractAddress: dAppData[3] as string,
      deployerAddress: dAppData[4] as string,
      isActive: dAppData[5] as boolean,
      registeredAt: dAppData[6] as bigint,
      tokenAddress: dAppData[7] && (dAppData[7] as string) !== '0x0000000000000000000000000000000000000000' 
        ? (dAppData[7] as string) 
        : null,
    };
  }

  return {
    data: parsedData,
    isLoading: isLoadingId || isLoadingData,
    dAppId: dAppId ? Number(dAppId) : null,
  };
}

/**
 * Get dApp ID from contract address
 */
export function useDAppIdByContract(contractAddress: string | undefined, chainId: number | undefined) {
  let dAppRegistryAddress = '';
  try {
    if (typeof getContractAddress === 'function') {
      dAppRegistryAddress = getContractAddress(chainId || 0, 'DAppRegistry') || '';
    }
  } catch (e) {
    console.warn('getContractAddress not available, using fallback');
  }

  if (!dAppRegistryAddress && CONTRACT_ADDRESSES) {
    if (chainId === 202555 && CONTRACT_ADDRESSES.kasplexL2Mainnet) {
      dAppRegistryAddress = CONTRACT_ADDRESSES.kasplexL2Mainnet.DAppRegistry || '';
    } else if (chainId === 167012 && CONTRACT_ADDRESSES.kasplexL2Testnet) {
      dAppRegistryAddress = CONTRACT_ADDRESSES.kasplexL2Testnet.DAppRegistry || '';
    }
  }

  const { data: dAppId, isLoading } = useReadContract({
    address: dAppRegistryAddress as `0x${string}`,
    abi: DAPP_REGISTRY_ABI,
    functionName: 'getDAppIdByContract',
    args: contractAddress ? [contractAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!dAppRegistryAddress && !!contractAddress && !!chainId && contractAddress.startsWith('0x'),
    },
  });

  return {
    dAppId: dAppId ? Number(dAppId) : null,
    isLoading,
  };
}

/**
 * Load saved metadata from localStorage
 */
export function loadDAppMetadata(dappId: string): Partial<DApp> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const key = `dapp_${dappId}_metadata`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Error loading dApp metadata from localStorage:', err);
  }

  return null;
}

/**
 * Merge contract data with frontend placeholder data and localStorage metadata
 */
export function mergeDAppData(contractData: ContractDAppData | null, frontendData: DApp): DApp {
  // Load saved metadata from localStorage
  const savedMetadata = loadDAppMetadata(frontendData.id);

  // Start with frontend data
  let merged: DApp = { ...frontendData };

  // Apply contract data if available
  if (contractData) {
    // Map contract category to frontend category type
    const categoryMap: Record<string, string> = {
      'payment': 'payment',
      'subscription': 'subscription',
      'dao': 'dao',
      'tools': 'tools',
      'general': 'general',
      'minting': 'minting',
      'defi': 'defi',
      'games': 'games',
      'promotion': 'promotion',
      'collabs': 'collabs',
      'airdrops': 'airdrops',
      'tracker': 'tracker',
    };

    const mappedCategory = categoryMap[contractData.category.toLowerCase()] || frontendData.category;

    merged = {
      ...merged,
      name: contractData.name || merged.name,
      version: contractData.version || merged.version,
      category: mappedCategory as any,
    };
  }

  // Apply saved metadata from localStorage (overrides contract and frontend data)
  if (savedMetadata) {
    merged = {
      ...merged,
      ...savedMetadata,
      // Preserve id and slug
      id: merged.id,
      slug: merged.slug || merged.id,
    };
  }

  return merged;
}

