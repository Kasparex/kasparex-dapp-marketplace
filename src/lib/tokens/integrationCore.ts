/**
 * Server-safe Hub utility integration helpers (no localStorage / client data imports).
 */

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
  /** Present when resolved from local listings; omitted in API summaries. */
  listing?: PublishedTokenListing;
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
  const deployer = listing.onChainSnapshot?.deployer ?? listing.deployerAddress;
  if (deployer) keys.add(canonicalizeWalletKey(deployer));
  const proofWallet = listing.ownershipProof?.walletAddress;
  if (proofWallet) keys.add(canonicalizeWalletKey(proofWallet));
  return Array.from(keys);
}

function walletMatchesListing(wallet: string, listing: PublishedTokenListing): boolean {
  const key = canonicalizeWalletKey(wallet);
  return listingWalletKeys(listing).some((k) => k === key);
}

function listingHasUtilityModule(listing: PublishedTokenListing): boolean {
  if ((listing.paidModuleIds ?? []).includes('utility_integrations')) return true;
  if (listing.listing?.instantUtility) return true;
  if (
    listing.ownership === 'deployer_verified' &&
    (listing.modulesConfig?.utilityProducts ?? []).length > 0
  ) {
    return true;
  }
  return false;
}

function listingHasProduct(listing: PublishedTokenListing, productId: HubUtilityProductId): boolean {
  if (listing.listing?.instantUtility) {
    return productId === 'store' || productId === 'vdonations' || productId === 'vblog_tips';
  }
  return (listing.modulesConfig?.utilityProducts ?? []).includes(productId);
}

/** Resolve KRC-20 tick from snapshot or listing symbol (seed claims may lack snapshot). */
export function resolveListingTicker(listing: PublishedTokenListing): string | null {
  const fromSnapshot = listing.onChainSnapshot?.ticker?.trim().toUpperCase();
  if (fromSnapshot) return fromSnapshot;
  const symbol = listing.symbol?.trim().toUpperCase();
  if (!symbol || listing.assetKind !== 'real') return null;
  if (listing.listingNetwork === 'krc20' || listing.listingNetwork === 'kaspa_l1') return symbol;
  if (listing.networks?.some((entry) => entry.network === 'krc20')) return symbol;
  return null;
}

function isEligibleKrc20Listing(listing: PublishedTokenListing): boolean {
  if (listing.assetKind !== 'real' || !resolveListingTicker(listing)) return false;
  if (listing.listingNetwork === 'krc20') return true;
  if (listing.networks?.some((entry) => entry.network === 'krc20')) return true;
  // Legacy seed claims (e.g. GRID) used kaspa_l1 before krc20 was set explicitly.
  if (listing.listingNetwork === 'kaspa_l1') return true;
  return false;
}

export function integratedTokenFromListing(
  listing: PublishedTokenListing,
  opts?: { includeListing?: boolean },
): IntegratedToken | null {
  const tick = resolveListingTicker(listing);
  if (!tick) return null;
  const token: IntegratedToken = {
    tick,
    decimals: listing.onChainSnapshot?.decimals ?? listing.decimals ?? 8,
    symbol: listing.symbol,
    listingSlug: listing.slug,
  };
  if (opts?.includeListing !== false) {
    token.listing = listing;
  }
  return token;
}

export function isHubProductWired(productId: HubUtilityProductId): boolean {
  return WIRED_HUB_UTILITY_PRODUCTS.includes(productId);
}

export function findIntegratedListingInList(
  wallet: string | null | undefined,
  productId: HubUtilityProductId,
  listings: PublishedTokenListing[],
  options?: { requireVerified?: boolean },
): PublishedTokenListing | null {
  return (
    findAllIntegratedListingsForWallet(wallet, productId, listings, options)[0] ?? null
  );
}

export function findAllIntegratedListingsForWallet(
  wallet: string | null | undefined,
  productId: HubUtilityProductId,
  listings: PublishedTokenListing[],
  options?: { requireVerified?: boolean },
): PublishedTokenListing[] {
  if (!wallet) return [];
  const requireVerified = options?.requireVerified ?? true;
  const matches: PublishedTokenListing[] = [];

  for (const listing of listings) {
    if (!isEligibleKrc20Listing(listing)) continue;
    if (!walletMatchesListing(wallet, listing)) continue;
    if (!listingHasUtilityModule(listing)) continue;
    if (!listingHasProduct(listing, productId)) continue;
    if (requireVerified && listing.ownership !== 'deployer_verified') continue;
    matches.push(listing);
  }
  return matches;
}

/** All verified utility-integrated KRC-20 tokens for a hub product (registry-wide). */
export function listIntegratedTokensForProduct(
  productId: HubUtilityProductId,
  listings: PublishedTokenListing[],
  options?: { requireVerified?: boolean },
): IntegratedToken[] {
  const requireVerified = options?.requireVerified ?? true;
  const tokens: IntegratedToken[] = [];
  const seen = new Set<string>();

  for (const listing of listings) {
    if (!isEligibleKrc20Listing(listing)) continue;
    if (!listingHasUtilityModule(listing)) continue;
    if (!listingHasProduct(listing, productId)) continue;
    if (requireVerified && listing.ownership !== 'deployer_verified') continue;
    const token = integratedTokenFromListing(listing, { includeListing: false });
    if (!token || seen.has(token.tick)) continue;
    seen.add(token.tick);
    tokens.push(token);
  }

  return tokens;
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

  if (productId === 'store' || productId === 'vblog_tips' || productId === 'games' || productId === 'magazines') {
    const network = token.listingNetwork;
    if (network === 'krc20' || network === 'kaspa_l1' || network === 'kcc20') return 'live';
    return 'coming_soon';
  }

  return 'coming_soon';
}
