/**
 * IPFS Registry Management
 * Handles reading and writing product and purchase registries to IPFS
 */

import { getIPFSClient } from '@/lib/ipfs/client';
import { fetchJSON } from '@/lib/ipfs/gateway';
import type { ProductRegistry, PurchaseRegistry, Product, Purchase } from './types';

const REGISTRY_CID_ENV = 'NEXT_PUBLIC_STORE_REGISTRY_CID';
const PURCHASES_CID_ENV = 'NEXT_PUBLIC_STORE_PURCHASES_CID';

/**
 * Get current product registry CID from environment or localStorage
 */
export function getRegistryCID(): string | null {
  // Check localStorage first (for newly created products)
  if (typeof window !== 'undefined') {
    const storedCid = localStorage.getItem('store-registry-cid');
    if (storedCid) {
      return storedCid;
    }
  }
  // Fall back to environment variable
  return process.env.NEXT_PUBLIC_STORE_REGISTRY_CID || null;
}

/**
 * Store registry CID in localStorage (for immediate access after product creation)
 */
export function setRegistryCID(cid: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('store-registry-cid', cid);
  }
}

/**
 * Get current purchase registry CID from localStorage or environment
 */
export function getPurchasesCID(): string | null {
  // Check localStorage first (for newly recorded purchases)
  if (typeof window !== 'undefined') {
    const storedCid = localStorage.getItem('store-purchase-registry-cid');
    if (storedCid) {
      return storedCid;
    }
  }
  // Fall back to environment variable
  return process.env.NEXT_PUBLIC_STORE_PURCHASES_CID || null;
}

/**
 * Store purchase registry CID in localStorage (for immediate access after purchase)
 */
export function setPurchasesCID(cid: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('store-purchase-registry-cid', cid);
  }
}

/**
 * Fetch product registry from IPFS
 */
export async function fetchProductRegistry(
  cid?: string | null
): Promise<ProductRegistry | null> {
  const registryCID = cid || getRegistryCID();
  if (!registryCID) {
    // Don't warn if no CID - this is expected when using demo products
    return null;
  }

  try {
    const registry = await fetchJSON<ProductRegistry>(registryCID);
    if (!registry || !registry.products) {
      console.warn('Registry fetched but invalid structure');
      return null;
    }
    return registry;
  } catch (error) {
    console.error('Failed to fetch product registry:', error);
    // Return null to allow fallback to demo products
    return null;
  }
}

/**
 * Fetch purchase registry from IPFS
 */
export async function fetchPurchaseRegistry(
  cid?: string | null
): Promise<PurchaseRegistry | null> {
  const purchasesCID = cid || getPurchasesCID();
  if (!purchasesCID) {
    console.warn('No purchase registry CID configured');
    return null;
  }

  try {
    const registry = await fetchJSON<PurchaseRegistry>(purchasesCID);
    return registry;
  } catch (error) {
    console.error('Failed to fetch purchase registry:', error);
    return null;
  }
}

/**
 * Upload product registry to IPFS
 */
export async function uploadProductRegistry(
  registry: ProductRegistry
): Promise<string | null> {
  try {
    const client = getIPFSClient();
    const cid = await client.uploadJSON(registry as unknown as Record<string, unknown>, { pin: true });
    
    // Update registry with its own CID
    registry.registryCid = cid;
    registry.updatedAt = Date.now();
    
    // Re-upload with updated CID
    const finalCid = await client.uploadJSON(registry as unknown as Record<string, unknown>, { pin: true });
    return finalCid;
  } catch (error) {
    console.error('Failed to upload product registry:', error);
    return null;
  }
}

/**
 * Upload purchase registry to IPFS
 */
export async function uploadPurchaseRegistry(
  registry: PurchaseRegistry
): Promise<string | null> {
  try {
    const client = getIPFSClient();
    const cid = await client.uploadJSON(registry as unknown as Record<string, unknown>, { 
      pin: true,
      filename: 'purchase-registry.json'
    });
    
    // Update registry with its own CID
    registry.registryCid = cid;
    registry.updatedAt = Date.now();
    
    // Re-upload with updated CID
    const finalCid = await client.uploadJSON(registry as unknown as Record<string, unknown>, { 
      pin: true,
      filename: 'purchase-registry.json'
    });
    return finalCid;
  } catch (error) {
    console.error('Failed to upload purchase registry:', error);
    return null;
  }
}

/**
 * Upload product data to IPFS with descriptive filename
 */
export async function uploadProduct(product: Product, filename?: string): Promise<string | null> {
  try {
    const client = getIPFSClient();
    // Use descriptive filename if provided, otherwise generate from slug
    const metadataFilename = filename || `${product.slug}-metadata.json`;
    const cid = await client.uploadJSON(product as unknown as Record<string, unknown>, { 
      pin: true,
      filename: metadataFilename 
    });
    return cid;
  } catch (error) {
    console.error('Failed to upload product:', error);
    return null;
  }
}

/**
 * Fetch product data from IPFS
 */
export async function fetchProduct(productCid: string): Promise<Product | null> {
  try {
    const product = await fetchJSON<Product>(productCid);
    return product;
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}

/**
 * Create initial empty registry
 */
export function createEmptyProductRegistry(): ProductRegistry {
  return {
    updatedAt: Date.now(),
    products: [],
  };
}

/**
 * Create initial empty purchase registry
 */
export function createEmptyPurchaseRegistry(): PurchaseRegistry {
  return {
    updatedAt: Date.now(),
    purchases: [],
  };
}
