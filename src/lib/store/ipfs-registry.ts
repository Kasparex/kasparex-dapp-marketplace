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
 * Get current product registry CID from environment
 */
export function getRegistryCID(): string | null {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_STORE_REGISTRY_CID || null;
  }
  return process.env.NEXT_PUBLIC_STORE_REGISTRY_CID || null;
}

/**
 * Get current purchase registry CID from environment
 */
export function getPurchasesCID(): string | null {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_STORE_PURCHASES_CID || null;
  }
  return process.env.NEXT_PUBLIC_STORE_PURCHASES_CID || null;
}

/**
 * Fetch product registry from IPFS
 */
export async function fetchProductRegistry(
  cid?: string | null
): Promise<ProductRegistry | null> {
  const registryCID = cid || getRegistryCID();
  if (!registryCID) {
    console.warn('No product registry CID configured');
    return null;
  }

  try {
    const registry = await fetchJSON<ProductRegistry>(registryCID);
    return registry;
  } catch (error) {
    console.error('Failed to fetch product registry:', error);
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
    const cid = await client.uploadJSON(registry as Record<string, unknown>, { pin: true });
    
    // Update registry with its own CID
    registry.registryCid = cid;
    registry.updatedAt = Date.now();
    
    // Re-upload with updated CID
    const finalCid = await client.uploadJSON(registry as Record<string, unknown>, { pin: true });
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
    const cid = await client.uploadJSON(registry as Record<string, unknown>, { pin: true });
    
    // Update registry with its own CID
    registry.registryCid = cid;
    registry.updatedAt = Date.now();
    
    // Re-upload with updated CID
    const finalCid = await client.uploadJSON(registry as Record<string, unknown>, { pin: true });
    return finalCid;
  } catch (error) {
    console.error('Failed to upload purchase registry:', error);
    return null;
  }
}

/**
 * Upload product data to IPFS
 */
export async function uploadProduct(product: Product): Promise<string | null> {
  try {
    const client = getIPFSClient();
    const cid = await client.uploadJSON(product as Record<string, unknown>, { pin: true });
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
