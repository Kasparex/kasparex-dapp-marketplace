/**
 * Purchase Tracking Functions
 * IPFS-based purchase operations
 */

import {
  fetchPurchaseRegistry,
  uploadPurchaseRegistry,
  createEmptyPurchaseRegistry,
} from './ipfs-registry';
import { incrementProductPurchaseCount } from './products';
import type { Purchase, PurchaseRegistry } from './types';

/**
 * Generate UUID
 */
function generateUUID(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Record a purchase
 */
export async function recordPurchase(
  purchaseData: Omit<Purchase, 'id' | 'purchasedAt'>
): Promise<{ purchase: Purchase; registryCid: string } | null> {
  try {
    // Create purchase
    const purchase: Purchase = {
      ...purchaseData,
      id: generateUUID(),
      purchasedAt: Date.now(),
    };

    // Fetch or create purchase registry
    let registry = await fetchPurchaseRegistry();
    if (!registry) {
      registry = createEmptyPurchaseRegistry();
    }

    // Add purchase to registry
    registry.purchases.push(purchase);
    registry.updatedAt = Date.now();

    // Upload updated registry
    const registryCid = await uploadPurchaseRegistry(registry);
    if (!registryCid) {
      throw new Error('Failed to upload purchase registry to IPFS');
    }

    // Increment product purchase count
    await incrementProductPurchaseCount(purchase.productId);

    return { purchase, registryCid };
  } catch (error) {
    console.error('Failed to record purchase:', error);
    return null;
  }
}

/**
 * Check if user has purchased a product
 */
export async function hasUserPurchased(
  productId: string,
  buyerAddress: string
): Promise<boolean> {
  const registry = await fetchPurchaseRegistry();
  if (!registry) {
    return false;
  }

  return registry.purchases.some(
    (p) =>
      p.productId === productId &&
      p.buyerAddress.toLowerCase() === buyerAddress.toLowerCase()
  );
}

/**
 * Get purchase by transaction hash
 */
export async function getPurchaseByTxHash(txHash: string): Promise<Purchase | null> {
  const registry = await fetchPurchaseRegistry();
  if (!registry) {
    return null;
  }

  const purchase = registry.purchases.find((p) => p.txHash === txHash);
  return purchase || null;
}

/**
 * Get purchases by buyer address
 */
export async function getPurchasesByBuyer(buyerAddress: string): Promise<Purchase[]> {
  const registry = await fetchPurchaseRegistry();
  if (!registry) {
    return [];
  }

  return registry.purchases.filter(
    (p) => p.buyerAddress.toLowerCase() === buyerAddress.toLowerCase()
  );
}

/**
 * Get purchases by product ID
 */
export async function getPurchasesByProduct(productId: string): Promise<Purchase[]> {
  const registry = await fetchPurchaseRegistry();
  if (!registry) {
    return [];
  }

  return registry.purchases.filter((p) => p.productId === productId);
}

/**
 * Get purchases by seller (through product IDs)
 */
export async function getPurchasesBySeller(
  sellerAddress: string,
  productIds: string[]
): Promise<Purchase[]> {
  if (productIds.length === 0) {
    return [];
  }

  const registry = await fetchPurchaseRegistry();
  if (!registry) {
    return [];
  }

  return registry.purchases.filter(
    (p) => productIds.includes(p.productId)
  );
}
