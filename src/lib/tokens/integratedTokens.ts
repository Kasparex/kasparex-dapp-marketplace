/**
 * Client helpers for Hub utility integrations (localStorage listings).
 */

import { getAllPublishedListings } from './data';
import {
  findAllIntegratedListingsForWallet,
  findIntegratedListingInList,
  integratedTokenFromListing,
  listIntegratedTokensForProduct,
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
  findAllIntegratedListingsForWallet,
  findIntegratedListingInList,
  integratedTokenFromListing,
  isHubProductWired,
  listIntegratedTokensForProduct,
  resolveHubUtilityProductStatus,
  resolveListingTicker,
};

export function getIntegratedTokensForWallet(
  wallet: string | null | undefined,
  productId: HubUtilityProductId,
): IntegratedToken[] {
  const listings = findAllIntegratedListingsForWallet(wallet, productId, getAllPublishedListings());
  return listings
    .map((listing) => integratedTokenFromListing(listing))
    .filter((token): token is IntegratedToken => token != null);
}

export function getIntegratedTokenForWallet(
  wallet: string | null | undefined,
  productId: HubUtilityProductId,
): IntegratedToken | null {
  return getIntegratedTokensForWallet(wallet, productId)[0] ?? null;
}

export function getIntegratedTokenForAuthor(
  authorAddress: string,
  productId: HubUtilityProductId,
): IntegratedToken | null {
  return getIntegratedTokenForWallet(authorAddress, productId);
}

export function getIntegratedTokensForProductFromLocal(
  productId: HubUtilityProductId,
): IntegratedToken[] {
  return listIntegratedTokensForProduct(productId, getAllPublishedListings());
}

export function findIntegratedListingForWallet(
  wallet: string | null | undefined,
  productId: HubUtilityProductId,
  options?: { requireVerified?: boolean },
): PublishedTokenListing | null {
  return findIntegratedListingInList(wallet, productId, getAllPublishedListings(), options);
}
