/**
 * React Hook for NFT Status
 * Fetches user's NFTs and computes NFT status
 */

import { useState, useEffect, useCallback } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { queryL1NFTs, type UserNFT } from '@/lib/nft/nft-query';
import { fetchMultipleNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';
import type { NFTStatus } from '@/lib/rewards/types';
import { isDiamondNFT } from '@/lib/nft/diamond-detection';
import { collections, getAllSupportedCollectionIds, getPartnerCollections } from '@/lib/nft/collections';
import { calculateTotalNFTPoints } from '@/lib/nft/points';

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
  metadataMap: Map<string, ParsedNFTMetadata>,
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

    if (collection === 'KREXPRIME') {
      status.hasKREXPRIME = true;
    } else if (collection === 'PIXELKREX') {
      status.hasPIXELKREX = true;
    } else if (collectionConfig?.isPartnerCollection) {
      status.partnerCollections![collection] = true;
    }

    const isDiamond = isDiamondNFT(collection, metadata);
    if (isDiamond) {
      if (collection === 'KREXPRIME') {
        status.hasDiamondKREXPRIME = true;
      } else if (collection === 'PIXELKREX') {
        status.hasDiamondPIXELKREX = true;
      } else if (collectionConfig?.isPartnerCollection) {
        status.partnerDiamonds![collection] = true;
      }
    }

    if (isRareNFT(collection, tokenId)) {
      status.hasRarestNFT = true;
    }
  }

  return status;
}

function emptyNFTStatus(): NFTStatus {
  const emptyStatus: NFTStatus = {
    hasKREXPRIME: false,
    hasPIXELKREX: false,
    hasDiamondKREXPRIME: false,
    hasDiamondPIXELKREX: false,
    hasRarestNFT: false,
    partnerCollections: {},
    partnerDiamonds: {},
  };
  getPartnerCollections().forEach((coll) => {
    emptyStatus.partnerCollections![coll.id] = false;
    emptyStatus.partnerDiamonds![coll.id] = false;
  });
  return emptyStatus;
}

export interface UseNFTStatusReturn {
  nftStatus: NFTStatus | null;
  nfts: UserNFT[];
  nftPoints: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and compute NFT status for connected wallet
 */
export function useNFTStatus(): UseNFTStatusReturn {
  const { state } = useKaspaWallet();
  const rawAddress = state.address;
  const isConnected = state.isConnected;

  const [nftStatus, setNftStatus] = useState<NFTStatus | null>(null);
  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [nftPoints, setNftPoints] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTStatus = useCallback(async () => {
    if (!isConnected || !rawAddress) {
      setNftStatus(null);
      setNfts([]);
      setNftPoints(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    let walletAddress = rawAddress;
    try {
      walletAddress = normalizeKaspaAddress(rawAddress);
    } catch {
      walletAddress = rawAddress.startsWith('kaspa:') ? rawAddress : `kaspa:${rawAddress}`;
    }

    setIsLoading(true);
    setError(null);

    try {
      const allCollectionIds = getAllSupportedCollectionIds();
      const userNFTs = await queryL1NFTs(walletAddress, allCollectionIds);
      setNfts(userNFTs);

      if (userNFTs.length === 0) {
        setNftStatus(emptyNFTStatus());
        setNftPoints(0);
        return;
      }

      const metadataMap = new Map<string, ParsedNFTMetadata>();
      const nftsByCollection = new Map<string, number[]>();
      userNFTs.forEach((nft) => {
        if (!nftsByCollection.has(nft.collection)) {
          nftsByCollection.set(nft.collection, []);
        }
        nftsByCollection.get(nft.collection)!.push(nft.tokenId);
      });

      for (const [collectionId, tokenIds] of nftsByCollection.entries()) {
        const collectionMetadata = await fetchMultipleNFTMetadata(collectionId, tokenIds);
        collectionMetadata.forEach((metadata, tokenId) => {
          metadataMap.set(`${collectionId}-${tokenId}`, metadata);
        });
      }

      const status = computeNFTStatus(userNFTs, metadataMap);
      setNftStatus(status);
      setNftPoints(calculateTotalNFTPoints(userNFTs, metadataMap));
    } catch (err) {
      console.error('Error fetching NFT status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch NFT status');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, rawAddress]);

  useEffect(() => {
    void fetchNFTStatus();
  }, [fetchNFTStatus]);

  useEffect(() => {
    const onFocus = () => {
      void fetchNFTStatus();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchNFTStatus]);

  return {
    nftStatus,
    nfts,
    nftPoints,
    isLoading,
    error,
    refetch: fetchNFTStatus,
  };
}
