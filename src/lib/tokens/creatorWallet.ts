import { getPublishedListingById, getPublishedListingBySlug } from '@/lib/tokens/data';
import type { Token } from '@/lib/tokens/types';

/** Resolve the Kaspa L1 wallet that receives listing vote payments. */
export function resolveTokenCreatorWallet(token: Token): string | null {
  const direct = token.creatorWallet?.trim();
  if (direct) return direct;
  const listing =
    getPublishedListingById(token.id) ?? getPublishedListingBySlug(token.slug);
  return listing?.author?.trim() ?? null;
}
