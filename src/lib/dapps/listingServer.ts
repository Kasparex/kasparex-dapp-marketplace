import { getHubContentRegistry } from '@/lib/hub/contentRegistry';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';

export async function getDirectoryListingBySlugServer(slug: string): Promise<DirectoryListing | undefined> {
  const registry = await getHubContentRegistry();
  const listing = registry.dapps.find((item) => item.slug === slug && item.status === 'active');
  return listing;
}

export function listingFeaturedImageUrl(listing: DirectoryListing): string | undefined {
  if (listing.featureImageUrl?.trim()) return listing.featureImageUrl.trim();
  if (listing.featureImageCid) return getBestGatewayUrl(listing.featureImageCid);
  if (listing.logoUrl?.trim()) return listing.logoUrl.trim();
  if (listing.logoCid) return getBestGatewayUrl(listing.logoCid);
  return undefined;
}
