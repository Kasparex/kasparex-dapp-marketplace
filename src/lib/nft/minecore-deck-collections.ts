import { NFT_POINTS } from '@/lib/leaderboard/nftPoints';

/**
 * NFT collections allowed on the **Worker** deck row in Minecore / Diamond Mining Worker slots.
 * Includes Kasparex premium collections (e.g. KREXPRIME, PIXELKREX) and registered partner collections.
 */
export function getMinecoreWorkerRowCollectionAllowlist(): string[] {
  const premium = [...NFT_POINTS.premiumCollections] as string[];
  const partners = Object.keys(NFT_POINTS.partnerCollections);
  return [...new Set(premium.map((c) => String(c).toUpperCase()).concat(partners.map((c) => String(c).toUpperCase())))];
}
