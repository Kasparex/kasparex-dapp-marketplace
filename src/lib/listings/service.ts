/**
 * Listing Service - Handles listing operations with IPFS and wallet integration
 */

import { CreateListingFormData, Listing, ListingFilters, ListingMetadata } from './types';
import { uploadToStoracha, uploadJSONToStoracha, resolveAsset } from '@/lib/storage/decentralized';

/**
 * Upload listing images to IPFS
 */
export async function uploadListingImages(
  logoFile?: File,
  bannerFile?: File
): Promise<{ logoCid?: string; bannerCid?: string }> {
  const results: { logoCid?: string; bannerCid?: string } = {};

  try {
    if (logoFile) {
      const logoResult = await uploadToStoracha(logoFile, { pin: true });
      results.logoCid = logoResult.cid;
    }
    if (bannerFile) {
      const bannerResult = await uploadToStoracha(bannerFile, { pin: true });
      results.bannerCid = bannerResult.cid;
    }
  } catch (error) {
    throw new Error(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return results;
}

/**
 * Upload listing metadata to IPFS
 */
export async function uploadListingMetadata(
  metadata: ListingMetadata
): Promise<string> {
  try {
    // Cast through unknown first for TypeScript compatibility
    const result = await uploadJSONToStoracha(metadata as unknown as Record<string, unknown>, { pin: true });
    return result.cid;
  } catch (error) {
    throw new Error(`Failed to upload metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a new listing
 * Full flow: upload images → create metadata → upload metadata → prepare transaction
 */
export async function createListing(
  formData: CreateListingFormData,
  walletProvider: 'kasware' | 'kastle'
): Promise<{ metadataCid: string; imageCids: { logoCid?: string; bannerCid?: string } }> {
  // Step 1: Upload images
  const imageCids = await uploadListingImages(formData.logoFile, formData.bannerFile);

  // Step 2: Create metadata JSON
  const metadata: ListingMetadata = {
    name: formData.name,
    description: formData.description,
    category: formData.category,
    tags: formData.tags,
    links: formData.links,
    images: {
      logoCid: imageCids.logoCid,
      bannerCid: imageCids.bannerCid,
    },
    version: '1.0',
  };

  // Step 3: Upload metadata
  const metadataCid = await uploadListingMetadata(metadata);

  // Step 4: Prepare transaction (will be handled by wallet)
  // Transaction should contain: metadataCid in OP_RETURN/data field
  // Fee: 5 KAS to treasury address

  return { metadataCid, imageCids };
}

/**
 * Update an existing listing
 * Creates new transaction with new IPFS CID
 */
export async function updateListing(
  listingId: string,
  formData: CreateListingFormData,
  walletProvider: 'kasware' | 'kastle'
): Promise<{ metadataCid: string; imageCids: { logoCid?: string; bannerCid?: string } }> {
  // Same flow as createListing - creates new transaction and IPFS CID
  return createListing(formData, walletProvider);
}

/**
 * Get a single listing from API
 */
export async function getListing(id: string): Promise<Listing> {
  const response = await fetch(`/api/listings/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch listing: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get filtered listings from API
 */
export async function getListings(filters?: ListingFilters): Promise<Listing[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.tags && filters.tags.length > 0) {
    filters.tags.forEach(tag => params.append('tags', tag));
  }
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.ownerWallet) params.append('ownerWallet', filters.ownerWallet);

  const response = await fetch(`/api/listings?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch listings: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Resolve listing images from IPFS CIDs to URLs
 */
export async function resolveListingImages(
  logoCid?: string,
  bannerCid?: string
): Promise<{ logoUrl?: string; bannerUrl?: string }> {
  const results: { logoUrl?: string; bannerUrl?: string } = {};

  try {
    if (logoCid) {
      results.logoUrl = await resolveAsset(logoCid);
    }
    if (bannerCid) {
      results.bannerUrl = await resolveAsset(bannerCid);
    }
  } catch (error) {
    console.error('Failed to resolve images:', error);
    // Return empty results on error - UI will handle fallback
  }

  return results;
}

/**
 * Verify ownership of a listing
 */
export async function verifyOwnership(
  listingId: string,
  walletAddress: string
): Promise<boolean> {
  try {
    const listing = await getListing(listingId);
    return listing.ownerWallet.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('Failed to verify ownership:', error);
    return false;
  }
}

