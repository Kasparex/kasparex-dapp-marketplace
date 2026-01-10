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
import { NFT_MULTIPLIER, DIAMOND_NFT_MULTIPLIER, RAREST_NFT_MULTIPLIER } from '@/lib/rewards/types';

export const NFT_POINTS = {
  REGULAR: 1,
  DIAMOND: 5,
  RAREST: 10,
} as const;

/**
 * Calculate NFT points based on status
 * Uses the highest tier NFT owned (Rarest > Diamond > Regular)
 * Partner collections are treated as regular NFTs for points (or Diamond if they have Diamond NFTs)
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
