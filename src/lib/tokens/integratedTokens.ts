/**
 * Resolve Hub utility integrations from published listings (localStorage only, no network).
 */

import { getAllPublishedListings } from './data';
import type { PublishedTokenListing } from './listingRecord';
import type { HubUtilityProductId } from './utilityRegistry';
import type { Token } from './types';
import { tokenHasModule } from './modules';

/** Products with real checkout wired in v1. */
export const WIRED_HUB_UTILITY_PRODUCTS: HubUtilityProductId[] = ['store', 'vblog_tips'];

export type IntegratedToken = {
  tick: string;
  decimals: number;
  symbol: string;
  listingSlug: string;
  listing: PublishedTokenListing;
};

function canonicalizeWalletKey(input: string): string {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return raw;
  if (raw.startsWith('evm:')) return raw;
  if (raw.endsWith('.kas')) return raw;
  if (raw.startsWith('kaspa:')) return raw;
  if (/^q[a-z0-9]{30,}$/i.test(raw)) return `kaspa:${raw}`;
  return raw;
}

function listingWalletKeys(listing: PublishedTokenListing): string[] {
  const keys = new Set<string>();
  if (listing.author) keys.add(canonicalizeWalletKey(listing.author));
  const deployer = listing.onChainSnapshot?.deployer;
  if (deployer) keys.add(canonicalizeWalletKey(deployer));
  return Array.from(keys);
}

function walletMatchesListing(wallet: string, listing: PublishedTokenListing): boolean {
  const key = canonicalizeWalletKey(wallet);
  return listingWalletKeys(listing).some((k) => k === key);
}

function listingHasUtilityModule(listing: PublishedTokenListing): boolean {
  return (listing.paidModuleIds ?? []).includes('utility_integrations');
}

function listingHasProduct(listing: PublishedTokenListing, productId: HubUtilityProductId): boolean {
  return (listing.modulesConfig?.utilityProducts ?? []).includes(productId);
}

function isEligibleKrc20Listing(listing: PublishedTokenListing): boolean {
  return (
    listing.assetKind === 'real' &&
    listing.listingNetwork === 'krc20' &&
    Boolean(listing.onChainSnapshot?.ticker)
  );
}

function toIntegratedToken(listing: PublishedTokenListing): IntegratedToken | null {
  const tick = listing.onChainSnapshot?.ticker?.toUpperCase();
  if (!tick) return null;
  return {
    tick,
    decimals: listing.onChainSnapshot?.decimals ?? 8,
    symbol: listing.symbol,
    listingSlug: listing.slug,
    listing,
  };
}

export function isHubProductWired(productId: HubUtilityProductId): boolean {
  return WIRED_HUB_UTILITY_PRODUCTS.includes(productId);
}

export function findIntegratedListingForWallet(
  wallet: string | null | undefined,
  productId: HubUtilityProductId,
  options?: { requireVerified?: boolean },
): PublishedTokenListing | null {
  if (!wallet) return null;
  const requireVerified = options?.requireVerified ?? true;

  for (const listing of getAllPublishedListings()) {
    if (!isEligibleKrc20Listing(listing)) continue;
    if (!walletMatchesListing(wallet, listing)) continue;
    if (!listingHasUtilityModule(listing)) continue;
    if (!listingHasProduct(listing, productId)) continue;
    if (requireVerified && listing.ownership !== 'deployer_verified') continue;
    return listing;
  }
  return null;
}

export function getIntegratedTokenForWallet(
  wallet: string | null | undefined,
  productId: HubUtilityProductId,
): IntegratedToken | null {
  const listing = findIntegratedListingForWallet(wallet, productId);
  return listing ? toIntegratedToken(listing) : null;
}

export function getIntegratedTokenForAuthor(
  authorAddress: string,
  productId: HubUtilityProductId,
): IntegratedToken | null {
  return getIntegratedTokenForWallet(authorAddress, productId);
}

export type HubUtilityProductStatus = 'live' | 'pending_verify' | 'coming_soon';

export function resolveHubUtilityProductStatus(
  token: Token,
  productId: HubUtilityProductId,
): HubUtilityProductStatus {
  if (!isHubProductWired(productId)) return 'coming_soon';

  const hasModule = tokenHasModule(token.paidModuleIds ?? [], 'utility_integrations');
  const selected = (token.modulesConfig?.utilityProducts ?? []).includes(productId);
  const instant = Boolean(token.listing?.instantUtility);

  if (!hasModule && !instant) return 'coming_soon';
  if (!selected && !instant) return 'coming_soon';

  if (token.assetKind === 'fictional' || token.assetKind == null) return 'coming_soon';
  if (!token.listing?.deployerVerified) return 'pending_verify';

  if (productId === 'store' || productId === 'vblog_tips') {
    const network = token.listingNetwork;
    if (network !== 'krc20') return 'coming_soon';
    return 'live';
  }

  return 'coming_soon';
}
