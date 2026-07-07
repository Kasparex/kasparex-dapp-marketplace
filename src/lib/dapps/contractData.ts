'use client';

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
  ticker: string | null;
  totalSupply: bigint | null;
  ipfsCID: string | null;
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
      refetchInterval: 60000, // Poll every 60 seconds (reduced from 30s for better performance)
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
      refetchInterval: 60000, // Poll every 60 seconds (reduced from 30s for better performance)
    },
  });

  // Periodic polling is handled by react-query refetchInterval above.
  // getDApp returns: (string name, string version, string category, address contractAddress, 
  // address deployer, bool isActive, uint256 createdAt, address tokenAddress, 
  // string ticker, uint256 totalSupply, string ipfsCID)
  let parsedData: ContractDAppData | null = null;
  if (dAppData && Array.isArray(dAppData) && dAppData.length >= 11) {
    const tokenAddress = dAppData[7] && (dAppData[7] as string) !== '0x0000000000000000000000000000000000000000' 
      ? (dAppData[7] as string) 
      : null;
    const ticker = dAppData[8] && (dAppData[8] as string).trim() !== '' 
      ? (dAppData[8] as string) 
      : null;
    const totalSupply = dAppData[9] && dAppData[9] !== BigInt(0)
      ? (dAppData[9] as bigint)
      : null;
    const ipfsCID = dAppData[10] && (dAppData[10] as string).trim() !== ''
      ? (dAppData[10] as string)
      : null;

    parsedData = {
      name: dAppData[0] as string,
      version: dAppData[1] as string,
      category: dAppData[2] as string,
      contractAddress: dAppData[3] as string,
      deployerAddress: dAppData[4] as string,
      isActive: dAppData[5] as boolean,
      registeredAt: dAppData[6] as bigint,
      tokenAddress,
      ticker,
      totalSupply,
      ipfsCID,
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
 * Load saved featured image from localStorage
 * @deprecated Use icon system instead. This is kept for backward compatibility.
 */
export function loadDAppFeaturedImage(dappId: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const key = `dapp_${dappId}_featuredImage`;
    const stored = localStorage.getItem(key);
    if (stored) {
      // Check if it's an IPFS CID
      const { isIPFSCID, getIPFSImageUrl } = require('./ipfs');
      if (isIPFSCID(stored)) {
        return getIPFSImageUrl(stored);
      }
      return stored;
    }
  } catch (err) {
    console.error('Error loading dApp featured image from localStorage:', err);
  }

  return null;
}

/**
 * Load saved logo from localStorage
 * @deprecated Use icon system instead. This is kept for backward compatibility.
 */
export function loadDAppLogo(dappId: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const key = `dapp_${dappId}_logo`;
    const stored = localStorage.getItem(key);
    if (stored) {
      // Check if it's an IPFS CID
      const { isIPFSCID, getIPFSImageUrl } = require('./ipfs');
      if (isIPFSCID(stored)) {
        return getIPFSImageUrl(stored);
      }
      return stored;
    }
  } catch (err) {
    console.error('Error loading dApp logo from localStorage:', err);
  }

  return null;
}

/**
 * Merge contract data with frontend placeholder data and localStorage metadata
 */
export function mergeDAppData(contractData: ContractDAppData | null, frontendData: DApp): DApp {
  // Load saved metadata from localStorage
  const savedMetadata = loadDAppMetadata(frontendData.id);
  const savedFeaturedImage = loadDAppFeaturedImage(frontendData.id);
  const savedLogo = loadDAppLogo(frontendData.id);

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
    const preservedLogo = merged.logoImage;
    const preservedListing = merged.directoryListing;
    merged = {
      ...merged,
      ...savedMetadata,
      // Preserve id and slug
      id: merged.id,
      slug: merged.slug || merged.id,
    };
    if (!merged.logoImage && preservedLogo) {
      merged.logoImage = preservedLogo;
    }
    if (!merged.directoryListing && preservedListing) {
      merged.directoryListing = preservedListing;
    }
  }

  // Apply saved images from localStorage (highest priority)
  if (savedFeaturedImage) {
    merged.featuredImage = savedFeaturedImage;
  }
  if (savedLogo) {
    merged.image = savedLogo;
    merged.logoImage = savedLogo;
  }

  return merged;
}

