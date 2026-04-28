import { NFT_POINTS } from '@/lib/leaderboard/nftPoints';

/**
 * NFT collections allowed on Workers-tab deck slots (worker / operator / foreman rows):
 * Kasparex premium collections plus registered partner collections.
 */
export function getMinecoreDeckCollectionAllowlist(): string[] {
  const premium = [...NFT_POINTS.premiumCollections] as string[];
  const partners = Object.keys(NFT_POINTS.partnerCollections);
  return [...new Set(premium.map((c) => String(c).toUpperCase()).concat(partners.map((c) => String(c).toUpperCase())))];
}

/** @deprecated Use getMinecoreDeckCollectionAllowlist */
export const getMinecoreWorkerRowCollectionAllowlist = getMinecoreDeckCollectionAllowlist;
