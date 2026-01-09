/**
 * React Hook for NFT Status
 * Fetches user's NFTs and computes NFT status
 */

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '~/lib/kaspa/provider';
import { queryL1NFTs, type UserNFT } from '~/lib/nft/nft-query';
import { fetchMultipleNFTMetadata, type ParsedNFTMetadata } from '~/lib/nft/metadata';
import { computeNFTStatus, type NFTStatus } from '~/lib/nft/status';
import { SUPPORTED_COLLECTIONS } from '~/lib/nft/config';

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
  const { address, isConnected } = useKaspaWallet();
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
      const userNFTs = await queryL1NFTs(address, [...SUPPORTED_COLLECTIONS]);
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
