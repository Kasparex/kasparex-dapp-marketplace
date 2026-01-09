/**
 * React Hook for NFT Status
 * Fetches user's NFTs and computes NFT status
 */

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { queryL1NFTs, type UserNFT } from '@/lib/nft/nft-query';
import { fetchMultipleNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';
import type { NFTStatus } from '@/lib/rewards/types';

// Import status computation functions
function hasDiamondTrait(metadata: ParsedNFTMetadata | null): boolean {
  if (!metadata) return false;
  
  const traits = metadata.traits || [];
  return traits.some((trait) => {
    const traitType = String(trait.trait_type || '').toLowerCase();
    return traitType.includes('diamond');
  });
}

function isRareNFT(collectionId: string, tokenId: number): boolean {
  const RARE_NFT_IDS = {
    KREXPRIME: [345],
    PIXELKREX: [515],
  };
  const rareIds = RARE_NFT_IDS[collectionId as keyof typeof RARE_NFT_IDS];
  return rareIds ? rareIds.includes(tokenId) : false;
}

function computeNFTStatus(
  nfts: UserNFT[],
  metadataMap: Map<string, ParsedNFTMetadata>
): NFTStatus {
  const status: NFTStatus = {
    hasKREXPRIME: false,
    hasPIXELKREX: false,
    hasDiamondKREXPRIME: false,
    hasDiamondPIXELKREX: false,
    hasRarestNFT: false,
  };

  for (const nft of nfts) {
    const { collection, tokenId } = nft;
    const metadataKey = `${collection}-${tokenId}`;
    const metadata = metadataMap.get(metadataKey);

    // Check collection ownership
    if (collection === 'KREXPRIME') {
      status.hasKREXPRIME = true;
    } else if (collection === 'PIXELKREX') {
      status.hasPIXELKREX = true;
    }

    // Check for Diamond NFT (trait-based)
    const isDiamond = hasDiamondTrait(metadata);
    if (isDiamond) {
      if (collection === 'KREXPRIME') {
        status.hasDiamondKREXPRIME = true;
      } else if (collection === 'PIXELKREX') {
        status.hasDiamondPIXELKREX = true;
      }
    }

    // Check for Rare NFT
    if (isRareNFT(collection, tokenId)) {
      status.hasRarestNFT = true;
    }
  }

  return status;
}

export interface UseNFTStatusReturn {
  nftStatus: NFTStatus | null;
  nfts: UserNFT[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and compute NFT status for connected wallet
 */
export function useNFTStatus(): UseNFTStatusReturn {
  const { state } = useKaspaWallet();
  const address = state.address;
  const isConnected = state.isConnected;
  
  const [nftStatus, setNftStatus] = useState<NFTStatus | null>(null);
  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTStatus = async () => {
    if (!isConnected || !address) {
      setNftStatus(null);
      setNfts([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Query user's NFTs from L1
      const userNFTs = await queryL1NFTs(address, ['KREXPRIME', 'PIXELKREX']);
      setNfts(userNFTs);

      if (userNFTs.length === 0) {
        // No NFTs found, return empty status
        setNftStatus({
          hasKREXPRIME: false,
          hasPIXELKREX: false,
          hasDiamondKREXPRIME: false,
          hasDiamondPIXELKREX: false,
          hasRarestNFT: false,
        });
        setIsLoading(false);
        return;
      }

      // Fetch metadata for all NFTs
      const metadataMap = new Map<string, ParsedNFTMetadata>();
      
      // Group NFTs by collection
      const nftsByCollection = new Map<string, number[]>();
      userNFTs.forEach((nft) => {
        if (!nftsByCollection.has(nft.collection)) {
          nftsByCollection.set(nft.collection, []);
        }
        nftsByCollection.get(nft.collection)!.push(nft.tokenId);
      });

      // Fetch metadata for each collection
      for (const [collectionId, tokenIds] of nftsByCollection.entries()) {
        const collectionMetadata = await fetchMultipleNFTMetadata(collectionId, tokenIds);
        collectionMetadata.forEach((metadata, tokenId) => {
          metadataMap.set(`${collectionId}-${tokenId}`, metadata);
        });
      }

      // Compute NFT status
      const status = computeNFTStatus(userNFTs, metadataMap);
      setNftStatus(status);
    } catch (err) {
      console.error('Error fetching NFT status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch NFT status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  return {
    nftStatus,
    nfts,
    isLoading,
    error,
    refetch: fetchNFTStatus,
  };
}
