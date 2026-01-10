/**
 * React Hook for NFT Status
 * Fetches user's NFTs and computes NFT status
 */

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { queryL1NFTs, type UserNFT } from '@/lib/nft/nft-query';
import { fetchMultipleNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';
import type { NFTStatus } from '@/lib/rewards/types';
import { isDiamondNFT } from '@/lib/nft/diamond-detection';
import { collections, getPartnerCollections } from '@/lib/nft/collections';

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
    partnerCollections: {},
    partnerDiamonds: {},
  };

  // Initialize partner collections tracking
  const partnerCollections = getPartnerCollections();
  partnerCollections.forEach((coll) => {
    status.partnerCollections![coll.id] = false;
    status.partnerDiamonds![coll.id] = false;
  });

  for (const nft of nfts) {
    const { collection, tokenId } = nft;
    const metadataKey = `${collection}-${tokenId}`;
    const metadata = metadataMap.get(metadataKey) || null;
    const collectionConfig = collections[collection];

    // Check collection ownership
    if (collection === 'KREXPRIME') {
      status.hasKREXPRIME = true;
    } else if (collection === 'PIXELKREX') {
      status.hasPIXELKREX = true;
    } else if (collectionConfig?.isPartnerCollection) {
      // Partner collection
      status.partnerCollections![collection] = true;
    }

    // Check for Diamond NFT (uses shared detection logic)
    const isDiamond = isDiamondNFT(collection, metadata);
    if (isDiamond) {
      if (collection === 'KREXPRIME') {
        status.hasDiamondKREXPRIME = true;
      } else if (collection === 'PIXELKREX') {
        status.hasDiamondPIXELKREX = true;
      } else if (collectionConfig?.isPartnerCollection) {
        // Partner collection Diamond
        status.partnerDiamonds![collection] = true;
      }
    }

    // Check for Rare NFT (only for KREXPRIME and PIXELKREX)
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
      // Get all collection IDs (main + partner)
      const allCollectionIds = Object.keys(collections);
      
      // Query user's NFTs from L1 (all collections)
      const userNFTs = await queryL1NFTs(address, allCollectionIds);
      setNfts(userNFTs);

      if (userNFTs.length === 0) {
        // No NFTs found, return empty status
        const emptyStatus: NFTStatus = {
          hasKREXPRIME: false,
          hasPIXELKREX: false,
          hasDiamondKREXPRIME: false,
          hasDiamondPIXELKREX: false,
          hasRarestNFT: false,
          partnerCollections: {},
          partnerDiamonds: {},
        };
        // Initialize partner collections
        getPartnerCollections().forEach((coll) => {
          emptyStatus.partnerCollections![coll.id] = false;
          emptyStatus.partnerDiamonds![coll.id] = false;
        });
        setNftStatus(emptyStatus);
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
