/**
 * NFT Points Calculation
 * Calculates points based on NFT ownership
 * 
 * Points system:
 * - Regular NFT: 1 point
 * - Diamond NFT: 5 points
 * - Rarest NFT: 10 points
 */

import type { NFTStatus } from '@/lib/rewards/types';
import type { UserNFT } from '@/lib/nft/nft-query';
import type { ParsedNFTMetadata } from './metadata';
import { isDiamondNFT } from './diamond-detection';

export const NFT_POINTS = {
  REGULAR: 1,
  DIAMOND: 5,
  RAREST: 10,
} as const;

/**
 * Rare NFT IDs (for KREXPRIME and PIXELKREX)
 */
const RARE_NFT_IDS = {
  KREXPRIME: [345],
  PIXELKREX: [515],
} as const;

function isRareNFT(collectionId: string, tokenId: number): boolean {
  const rareIds = RARE_NFT_IDS[collectionId as keyof typeof RARE_NFT_IDS];
  return rareIds ? rareIds.includes(tokenId) : false;
}

/**
 * Calculate total NFT points by summing points from all owned NFTs
 * Each NFT contributes points based on its tier (Rarest > Diamond > Regular)
 */
export function calculateTotalNFTPoints(
  nfts: UserNFT[],
  metadataMap: Map<string, ParsedNFTMetadata>
): number {
  let totalPoints = 0;

  for (const nft of nfts) {
    const { collection, tokenId } = nft;
    const metadataKey = `${collection}-${tokenId}`;
    const metadata = metadataMap.get(metadataKey) || null;

    // Check for Rarest NFT first (highest tier)
    if (isRareNFT(collection, tokenId)) {
      totalPoints += NFT_POINTS.RAREST;
    } else if (isDiamondNFT(collection, metadata)) {
      // Check for Diamond NFT
      totalPoints += NFT_POINTS.DIAMOND;
    } else {
      // Regular NFT
      totalPoints += NFT_POINTS.REGULAR;
    }
  }

  return totalPoints;
}

/**
 * Calculate NFT points based on status (legacy function - uses highest tier only)
 * @deprecated Use calculateTotalNFTPoints instead for accurate point calculation
 */
export function calculateNFTPoints(nftStatus: NFTStatus): number {
  if (nftStatus.hasRarestNFT) {
    return NFT_POINTS.RAREST;
  }
  const hasDiamond = nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX ||
    (nftStatus.partnerDiamonds && Object.values(nftStatus.partnerDiamonds).some(v => v));
  if (hasDiamond) {
    return NFT_POINTS.DIAMOND;
  }
  const hasRegular = nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX ||
    (nftStatus.partnerCollections && Object.values(nftStatus.partnerCollections).some(v => v));
  if (hasRegular) {
    return NFT_POINTS.REGULAR;
  }
  return 0;
}
