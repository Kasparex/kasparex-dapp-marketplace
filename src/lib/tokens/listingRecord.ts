/**
 * Published token listing records (developer dashboard / UaaS Phase 2).
 */

import type { Token, TokenListingStatus, TokenNetwork } from './types';
import type { TokenModuleId } from './modules';
import type { TokenContentTab } from './sections';

export type TokenPublishStatus =
  | 'draft'
  | 'verification_pending'
  | 'verified'
  | 'published';

export type TokenPageSectionType =
  | 'overview'
  | 'tokenomics'
  | 'roadmap'
  | 'markets'
  | 'swap'
  | 'utility'
  | 'comments'
  | 'links'
  | 'whitepaper';

export type TokenPageSectionConfig = {
  type: TokenPageSectionType;
  enabled: boolean;
};

export type TokenPageConfig = {
  version: 1;
  defaultTab: TokenContentTab;
  sections: TokenPageSectionConfig[];
};

export type TokenListingPricingSnapshot = {
  baseFeeKas: number;
  modulesFeeKas: number;
  networkFeeBufferKas: number;
  totalKas: number;
};

export type PublishedTokenListing = {
  id: string;
  listingId: string;
  slug: string;
  author: string;
  symbol: string;
  name: string;
  description: string;
  shortDescription?: string;
  tags?: string[];
  network: TokenNetwork;
  contractAddress?: string;
  logoCid?: string;
  featuredImageCid?: string;
  pageConfig: TokenPageConfig;
  publishDate: string;
  updatedAt?: string;
  metadataCid?: string;
  txHash?: string;
  commitTxHash?: string;
  contentHash?: string;
  status: TokenPublishStatus;
  paidModuleIds?: TokenModuleId[];
  listing?: TokenListingStatus;
  pricingSnapshot?: TokenListingPricingSnapshot;
};

export function listingToToken(listing: PublishedTokenListing): Token {
  const paid = listing.paidModuleIds ?? [];
  const directoryListing: TokenListingStatus = {
    verified: listing.status === 'verified' || listing.status === 'published',
    instantUtility: paid.includes('utility_integrations') || Boolean(listing.listing?.instantUtility),
    featured: paid.includes('featured_listing') || Boolean(listing.listing?.featured),
    utilityBadges: listing.listing?.utilityBadges,
    activityScore: listing.listing?.activityScore ?? 10,
    communityScore: listing.listing?.communityScore ?? 0,
  };

  return {
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    symbol: listing.symbol,
    description: listing.description,
    shortDescription: listing.shortDescription,
    network: listing.network,
    contractAddress: listing.contractAddress,
    type: 'collab',
    tags: listing.tags,
    logoCid: listing.logoCid,
    featuredImageCid: listing.featuredImageCid,
    metadataCid: listing.metadataCid,
    createdAt: listing.publishDate,
    updatedAt: listing.updatedAt,
    listing: directoryListing,
  };
}
