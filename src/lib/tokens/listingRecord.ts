/**
 * Published token listing records (developer dashboard / UaaS Phase 2).
 */

import type { Token, TokenListingStatus, TokenNetwork } from './types';
import type { TokenModuleId } from './modules';
import type { TokenContentTab } from './sections';
import type { TokenListingNetwork } from './listingNetwork';

export type TokenPublishStatus =
  | 'draft'
  | 'verification_pending'
  | 'verified'
  | 'published';

export type TokenAssetKind = 'fictional' | 'real';

export type TokenOwnershipStatus = 'none' | 'wallet_assigned' | 'deployer_verified';

export type TokenOnChainSnapshot = {
  source: 'krc20' | 'l2';
  ticker: string;
  name?: string;
  maxSupply?: string;
  minted?: string;
  decimals?: number;
  deployer?: string;
  owner?: string;
  contractAddress?: string;
  holderTotal?: number;
  fetchedAt: string;
};

export type TokenOwnershipProof = {
  method: string;
  walletAddress: string;
  signature?: string;
  verifiedAt: string;
};

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
  sizeFeeKas?: number;
  modulesFeeKas: number;
  networkFeeBufferKas: number;
  totalKas: number;
  payloadBytes?: number;
  chunkCount?: number;
};

/** One network deployment for a token project (primary or secondary). */
export type TokenNetworkEntry = {
  network: TokenListingNetwork;
  contractAddress?: string;
  /** True for the canonical / verified network (entry 0). */
  primary?: boolean;
  /** True when deployer/owner ownership was proven for this network. */
  verified?: boolean;
  label?: string;
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
  listingNetwork?: TokenListingNetwork;
  network: TokenNetwork;
  contractAddress?: string;
  logoUrl?: string;
  logoCid?: string;
  featuredImageUrl?: string;
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
  assetKind?: TokenAssetKind;
  ownership?: TokenOwnershipStatus;
  deployerAddress?: string;
  maxSupply?: number;
  totalSupply?: number;
  decimals?: number;
  onChainSnapshot?: TokenOnChainSnapshot;
  ownershipProof?: TokenOwnershipProof;
  /** Multi-network deployments; entry 0 is primary. */
  networks?: TokenNetworkEntry[];
};

function parseSupplyFromRaw(raw: string | undefined, decimals: number): number | undefined {
  if (!raw) return undefined;
  try {
    const n = BigInt(raw);
    const divisor = BigInt(10 ** Math.min(decimals, 18));
    return Number(n / divisor);
  } catch {
    return undefined;
  }
}

export function listingToToken(listing: PublishedTokenListing): Token {
  const paid = listing.paidModuleIds ?? [];
  const deployerVerified = listing.ownership === 'deployer_verified';
  const directoryListing: TokenListingStatus = {
    verified: deployerVerified,
    deployerVerified,
    instantUtility: paid.includes('utility_integrations') || Boolean(listing.listing?.instantUtility),
    featured: paid.includes('featured_listing') || Boolean(listing.listing?.featured),
    utilityBadges: listing.listing?.utilityBadges,
    activityScore: listing.listing?.activityScore ?? 10,
    communityScore: listing.listing?.communityScore ?? 0,
  };

  const decimals = listing.decimals ?? listing.onChainSnapshot?.decimals ?? (listing.listingNetwork === 'krc20' ? 8 : 18);
  const maxSupply =
    listing.maxSupply ??
    parseSupplyFromRaw(listing.onChainSnapshot?.maxSupply, decimals);
  const totalSupply =
    listing.totalSupply ??
    parseSupplyFromRaw(listing.onChainSnapshot?.minted, decimals);

  const primaryNetwork = listing.listingNetwork ?? 'l2_kasplex';
  const isL1Primary = primaryNetwork === 'kaspa_l1' || primaryNetwork === 'krc20';
  const l1FromNetworks = listing.networks?.find(
    (n) => n.network === 'kaspa_l1' || n.network === 'krc20',
  )?.contractAddress;
  const l2FromNetworks = listing.networks?.find(
    (n) => n.network === 'l2_kasplex' || n.network === 'l2_igra',
  )?.contractAddress;

  return {
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    symbol: listing.symbol,
    description: listing.description,
    shortDescription: listing.shortDescription,
    network: listing.listingNetwork
      ? (listing.listingNetwork === 'kaspa_l1' || listing.listingNetwork === 'krc20' ? 'L1' : 'L2')
      : listing.network,
    contractAddress: listing.contractAddress ?? listing.onChainSnapshot?.contractAddress,
    l1Address: isL1Primary
      ? (listing.contractAddress ?? l1FromNetworks)
      : l1FromNetworks,
    l2Address: !isL1Primary
      ? (listing.contractAddress ?? l2FromNetworks)
      : l2FromNetworks,
    networks: listing.networks,
    type: 'collab',
    tags: listing.tags,
    logo: listing.logoUrl,
    logoCid: listing.logoCid,
    featuredImage: listing.featuredImageUrl,
    featuredImageCid: listing.featuredImageCid,
    metadataCid: listing.metadataCid,
    createdAt: listing.publishDate,
    updatedAt: listing.updatedAt,
    maxSupply,
    totalSupply,
    circulatingSupply: totalSupply,
    decimals,
    listing: directoryListing,
  };
}
