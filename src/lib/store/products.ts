/**
 * Product Management Functions
 * IPFS-based product operations
 */

import {
  fetchProductRegistry,
  uploadProductRegistry,
  uploadProduct,
  fetchProduct,
  createEmptyProductRegistry,
} from './ipfs-registry';
import type { Product, ProductRegistry, ProductRegistryEntry } from './types';
import { syncHubContentItem } from '@/lib/hub/contentSync';
import { finalizeHubContentDelete } from '@/lib/hub/paidDelete';
import { upsertHubStoreProduct, removeHubStoreProduct, getHubSyncedStoreProducts } from './hubSync';
import { collectStoreMediaCids } from '@/lib/ipfs/cidUtils';

/**
 * Generate UUID
 */
function generateUUID(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate URL-friendly slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

function mergeProductLists(...lists: Product[][]): Product[] {
  const productMap = new Map<string, Product>();
  for (const list of lists) {
    for (const p of list) {
      if (p.status !== 'active') continue;
      productMap.set(p.slug, p);
    }
  }
  return Array.from(productMap.values());
}

async function fetchActiveRegistryProducts(registry: ProductRegistry): Promise<Product[]> {
  const active = registry.products.filter((entry) => entry.status === 'active');
  const results = await Promise.all(
    active.map(async (entry) => {
      try {
        return await fetchProduct(entry.productCid);
      } catch {
        return null;
      }
    }),
  );
  return results.filter((p): p is Product => Boolean(p && p.status === 'active'));
}

/**
 * Get all products from registry (parallel IPFS fetch) + Hub local cache.
 */
export async function getAllProducts(): Promise<Product[]> {
  const hubLocal = getHubSyncedStoreProducts();
  const registry = await fetchProductRegistry();

  if (!registry || registry.products.length === 0) {
    return hubLocal;
  }

  const fromRegistry = await fetchActiveRegistryProducts(registry);
  for (const product of fromRegistry) {
    upsertHubStoreProduct(product);
  }

  return mergeProductLists(hubLocal, fromRegistry);
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const hubHit = getHubSyncedStoreProducts().find((p) => p.slug === slug);
  if (hubHit) return hubHit;

  const registry = await fetchProductRegistry();

  if (registry && registry.products.length > 0) {
    const entry = registry.products.find((p) => p.slug === slug && p.status === 'active');

    if (entry) {
      const product = await fetchProduct(entry.productCid);
      if (product) {
        upsertHubStoreProduct(product);
        return product;
      }
    }
  }

  return null;
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const hubHit = getHubSyncedStoreProducts().find((p) => p.id === id);
  if (hubHit) return hubHit;

  const registry = await fetchProductRegistry();
  if (!registry) return null;

  const entry = registry.products.find((p) => p.id === id && p.status === 'active');
  if (!entry) return null;

  const product = await fetchProduct(entry.productCid);
  if (product) upsertHubStoreProduct(product);
  return product;
}

/**
 * Get products by seller address
 */
export async function getProductsBySeller(sellerAddress: string): Promise<Product[]> {
  const key = sellerAddress.toLowerCase();
  const hubLocal = getHubSyncedStoreProducts().filter(
    (p) => p.sellerAddress.toLowerCase() === key,
  );

  const registry = await fetchProductRegistry();
  if (!registry) return hubLocal;

  const sellerEntries = registry.products.filter(
    (p) => p.sellerAddress.toLowerCase() === key && p.status === 'active',
  );

  const fromRegistry = (
    await Promise.all(
      sellerEntries.map(async (entry) => {
        try {
          return await fetchProduct(entry.productCid);
        } catch {
          return null;
        }
      }),
    )
  ).filter((p): p is Product => Boolean(p));

  for (const product of fromRegistry) {
    upsertHubStoreProduct(product);
  }

  return mergeProductLists(hubLocal, fromRegistry);
}

/**
 * Create new product
 */
export async function createProduct(
  productData: Omit<Product, 'id' | 'slug' | 'createdAt' | 'purchaseCount' | 'listingFeePaid'>,
  listingFeeTxHash: string
): Promise<{ product: Product; registryCid: string } | null> {
  try {
    void listingFeeTxHash;
    // Generate ID and slug
    const id = generateUUID();
    const slug = generateSlug(productData.title);

    // Create product
    const product: Product = {
      ...productData,
      id,
      slug,
      createdAt: Date.now(),
      purchaseCount: 0,
      listingFeePaid: true, // Assume paid if we're creating it
    };

    // Upload product to IPFS with descriptive filename
    const productFilename = `${slug}-metadata.json`;
    const productCid = await uploadProduct(product, productFilename);
    if (!productCid) {
      throw new Error('Failed to upload product to IPFS');
    }

    // Fetch or create registry
    // Try to get from localStorage first (for newly created products), then fall back to env var
    let registry = await fetchProductRegistry();
    if (!registry) {
      registry = createEmptyProductRegistry();
    }

    // Check if slug already exists
    const existingSlug = registry.products.find((p) => p.slug === slug);
    if (existingSlug) {
      throw new Error('Product with this title already exists');
    }

    // Add to registry
    const registryEntry: ProductRegistryEntry = {
      id: product.id,
      slug: product.slug,
      productCid,
      thumbnailCid: product.thumbnailCid,
      sellerAddress: product.sellerAddress,
      priceKAS: product.priceKAS,
      paymentCurrency: product.paymentCurrency,
      network: product.network,
      category: product.category,
      status: product.status,
      createdAt: product.createdAt,
      purchaseCount: product.purchaseCount,
    };

    registry.products.push(registryEntry);
    registry.updatedAt = Date.now();

    // Upload updated registry
    const registryCid = await uploadProductRegistry(registry);
    if (!registryCid) {
      throw new Error('Failed to upload registry to IPFS');
    }

    // Store the new registry CID in localStorage for immediate access
    if (typeof window !== 'undefined') {
      localStorage.setItem('store-registry-cid', registryCid);
    }

    upsertHubStoreProduct(product);
    void syncHubContentItem('store', 'upsert', { item: product });

    return { product, registryCid };
  } catch (error) {
    console.error('Failed to create product:', error);
    return null;
  }
}

/**
 * Update product purchase count
 */
export async function incrementProductPurchaseCount(
  productId: string
): Promise<boolean> {
  try {
    const registry = await fetchProductRegistry();
    if (!registry) {
      return false;
    }

    const entry = registry.products.find((p) => p.id === productId);
    if (!entry) {
      return false;
    }

    // Fetch product and update
    const product = await fetchProduct(entry.productCid);
    if (!product) {
      return false;
    }

    product.purchaseCount += 1;
    entry.purchaseCount += 1;

    // Upload updated product
    const newProductCid = await uploadProduct(product);
    if (!newProductCid) {
      return false;
    }

    entry.productCid = newProductCid;
    registry.updatedAt = Date.now();

    // Upload updated registry
    const registryCid = await uploadProductRegistry(registry);
    return !!registryCid;
  } catch (error) {
    console.error('Failed to increment purchase count:', error);
    return false;
  }
}

/**
 * Archive product on IPFS registry (local + remote). Pair with executeHubPaidDelete from dashboards.
 */
export async function archiveProductLocal(
  productId: string,
  sellerAddress: string
): Promise<{ ok: boolean; product?: Product }> {
  try {
    const registry = await fetchProductRegistry();
    if (!registry) {
      return { ok: false };
    }

    const entry = registry.products.find(
      (p) => p.id === productId && p.sellerAddress.toLowerCase() === sellerAddress.toLowerCase()
    );
    if (!entry) {
      return { ok: false };
    }

    entry.status = 'archived';
    registry.updatedAt = Date.now();

    const product = await fetchProduct(entry.productCid);
    if (product) {
      product.status = 'archived';
      const newProductCid = await uploadProduct(product);
      if (newProductCid) entry.productCid = newProductCid;
    }

    const registryCid = await uploadProductRegistry(registry);
    if (registryCid && typeof window !== 'undefined') {
      localStorage.setItem('store-registry-cid', registryCid);
    }

    if (product) {
      removeHubStoreProduct(productId);
    }

    return { ok: !!registryCid, product: product ?? undefined };
  } catch (error) {
    console.error('Failed to archive product:', error);
    return { ok: false };
  }
}

/**
 * Archive product
 */
export async function archiveProduct(
  productId: string,
  sellerAddress: string
): Promise<boolean> {
  const result = await archiveProductLocal(productId, sellerAddress);
  if (!result.ok || !result.product) {
    return result.ok;
  }

  void finalizeHubContentDelete({
    kind: 'store',
    id: productId,
    mediaCids: collectStoreMediaCids(result.product),
    removeLocal: () => true,
  });

  return true;
}

export type ProductUpdateInput = Partial<
  Pick<
    Product,
    | 'title'
    | 'description'
    | 'content'
    | 'priceKAS'
    | 'paymentCurrency'
    | 'network'
    | 'category'
    | 'assetCids'
    | 'assetFileNames'
    | 'thumbnailCid'
    | 'tags'
  >
>;

/**
 * Update an existing product listing (seller must match).
 */
export async function updateProduct(
  productId: string,
  sellerAddress: string,
  updates: ProductUpdateInput
): Promise<{ product: Product; registryCid: string } | null> {
  try {
    const registry = await fetchProductRegistry();
    if (!registry) return null;

    const entry = registry.products.find(
      (p) => p.id === productId && p.sellerAddress.toLowerCase() === sellerAddress.toLowerCase()
    );
    if (!entry) return null;

    const product = await fetchProduct(entry.productCid);
    if (!product) return null;

    const nextTitle = updates.title?.trim() ?? product.title;
    const nextSlug = updates.title ? generateSlug(nextTitle) : product.slug;

    if (nextSlug !== product.slug) {
      const slugTaken = registry.products.some((p) => p.slug === nextSlug && p.id !== productId);
      if (slugTaken) throw new Error('Product with this title already exists');
    }

    const updated: Product = {
      ...product,
      ...updates,
      title: nextTitle,
      slug: nextSlug,
      description: updates.description?.trim() ?? product.description,
      content: updates.content !== undefined ? updates.content.trim() || undefined : product.content,
      tags: updates.tags !== undefined ? updates.tags : product.tags,
    };

    const productCid = await uploadProduct(updated, `${updated.slug}-metadata.json`);
    if (!productCid) throw new Error('Failed to upload updated product');

    entry.slug = updated.slug;
    entry.productCid = productCid;
    entry.thumbnailCid = updated.thumbnailCid;
    entry.priceKAS = updated.priceKAS;
    entry.paymentCurrency = updated.paymentCurrency;
    entry.network = updated.network;
    entry.category = updated.category;
    registry.updatedAt = Date.now();

    const registryCid = await uploadProductRegistry(registry);
    if (!registryCid) throw new Error('Failed to upload registry');

    if (typeof window !== 'undefined') {
      localStorage.setItem('store-registry-cid', registryCid);
    }

    upsertHubStoreProduct(updated);
    return { product: updated, registryCid };
  } catch (error) {
    console.error('Failed to update product:', error);
    return null;
  }
}
