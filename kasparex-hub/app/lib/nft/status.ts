/**
 * NFT Status Computation
 * Determines Diamond and Rare NFT status from user's NFTs
 */

import type { UserNFT } from './nft-query';
import type { ParsedNFTMetadata } from './metadata';
import { RARE_NFT_IDS, DIAMOND_NFT_IDS } from './config';

export interface NFTStatus {
  hasKREXPRIME: boolean;
  hasPIXELKREX: boolean;
  hasDiamondKREXPRIME: boolean;
  hasDiamondPIXELKREX: boolean;
  hasRarestNFT: boolean; // NFT #515 from PIXELKREX or #345 from KREXPRIME
}

/**
 * Check if NFT has Diamond trait in metadata
 */
export function hasDiamondTrait(metadata: ParsedNFTMetadata | null): boolean {
  if (!metadata) return false;
  
  const traits = metadata.traits || [];
  return traits.some((trait) => {
    const traitType = String(trait.trait_type || '').toLowerCase();
    return traitType.includes('diamond');
  });
}

/**
 * Check if token ID is in the Diamond fallback list
 */
export function isDiamondByTokenId(collectionId: string, tokenId: number): boolean {
  const diamondIds = DIAMOND_NFT_IDS[collectionId as keyof typeof DIAMOND_NFT_IDS];
  return diamondIds ? diamondIds.includes(tokenId) : false;
}

/**
 * Check if token ID is a Rare NFT
 */
export function isRareNFT(collectionId: string, tokenId: number): boolean {
  const rareIds = RARE_NFT_IDS[collectionId as keyof typeof RARE_NFT_IDS];
  return rareIds ? rareIds.includes(tokenId) : false;
}

/**
 * Compute NFT status from user's NFTs and their metadata
 */
export function computeNFTStatus(
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

    // Check for Diamond NFT (trait-based first, then fallback to ID list)
    const isDiamond = hasDiamondTrait(metadata) || isDiamondByTokenId(collection, tokenId);
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
