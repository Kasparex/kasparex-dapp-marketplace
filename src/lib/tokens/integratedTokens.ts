/**
 * Client helpers for Hub utility integrations (localStorage listings).
 */

import { getAllPublishedListings } from './data';
import {
  findIntegratedListingInList,
  integratedTokenFromListing,
  type HubUtilityProductStatus,
  type IntegratedToken,
  WIRED_HUB_UTILITY_PRODUCTS,
  isHubProductWired,
  resolveHubUtilityProductStatus,
  resolveListingTicker,
} from './integrationCore';
import type { PublishedTokenListing } from './listingRecord';
import type { HubUtilityProductId } from './utilityRegistry';

export type { HubUtilityProductStatus, IntegratedToken };
export {
  WIRED_HUB_UTILITY_PRODUCTS,
  findIntegratedListingInList,
  integratedTokenFromListing,
  isHubProductWired,
  resolveHubUtilityProductStatus,
  resolveListingTicker,
};

export function getIntegratedTokenForWallet(
  wallet: string | null | undefined,
  productId: HubUtilityProductId,
): IntegratedToken | null {
  const listing = findIntegratedListingForWallet(wallet, productId);
  return listing ? integratedTokenFromListing(listing) : null;
}

export function getIntegratedTokenForAuthor(
  authorAddress: string,
  productId: HubUtilityProductId,
): IntegratedToken | null {
  return getIntegratedTokenForWallet(authorAddress, productId);
}

export function findIntegratedListingForWallet(
  wallet: string | null | undefined,
  productId: HubUtilityProductId,
  options?: { requireVerified?: boolean },
): PublishedTokenListing | null {
  return findIntegratedListingInList(wallet, productId, getAllPublishedListings(), options);
}
