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
import { demoProducts } from './demo-products';
import { syncHubContentItem } from '@/lib/hub/contentSync';
import { finalizeHubContentDelete } from '@/lib/hub/paidDelete';
import { upsertHubStoreProduct, removeHubStoreProduct, getHubSyncedStoreProducts } from './hubSync';
import { collectStoreMediaCids } from '@/lib/ipfs/cidUtils';

function buildDemoProducts(): Product[] {
  // Deterministic IDs/slugs so routes remain stable across refreshes
  const baseTime = Date.now() - 1000 * 60 * 60 * 24 * 30; // ~30 days ago
  return demoProducts.map((p, idx) => {
    const slug = generateSlug(p.title);
    return {
      ...p,
      id: `demo-${slug}`,
      slug,
      createdAt: baseTime + idx * 1000 * 60 * 60 * 6,
      purchaseCount: [12, 4, 27, 2, 9, 6, 18, 3][idx] ?? 0,
      listingFeePaid: true,
    };
  });
}

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

/**
 * Get all products from registry
 */
export async function getAllProducts(): Promise<Product[]> {
  const registry = await fetchProductRegistry();
  
  // Always include demo products for testing
  const demoProducts = buildDemoProducts();
  
  if (!registry || registry.products.length === 0) {
    const hubOnly = getHubSyncedStoreProducts();
    if (hubOnly.length) {
      const productMap = new Map<string, Product>();
      demoProducts.forEach((p) => productMap.set(p.slug, p));
      hubOnly.forEach((p) => productMap.set(p.slug, p));
      return Array.from(productMap.values());
    }
    return demoProducts;
  }

  // Fetch full product data for each entry
  const products: Product[] = [];
  for (const entry of registry.products) {
    if (entry.status === 'active') {
      const product = await fetchProduct(entry.productCid);
      if (product) {
        products.push(product);
      }
    }
  }

  // Merge with demo products, avoiding duplicates by slug
  const productMap = new Map<string, Product>();
  
  // Add demo products first
  demoProducts.forEach(p => productMap.set(p.slug, p));
  
  // Add registry products (will overwrite demo products with same slug)
  products.forEach(p => productMap.set(p.slug, p));

  getHubSyncedStoreProducts().forEach((p) => {
    if (!productMap.has(p.slug)) productMap.set(p.slug, p);
  });
  
  return Array.from(productMap.values());
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  // Try to fetch from registry (checks localStorage first for new products)
  const registry = await fetchProductRegistry();
  
  if (registry && registry.products.length > 0) {
    const entry = registry.products.find((p) => p.slug === slug && p.status === 'active');
    
    if (entry) {
      const product = await fetchProduct(entry.productCid);
      if (product) {
        return product;
      }
    }
  }
  
  // Fall back to demo products
  const demoProducts = buildDemoProducts();
  const demoProduct = demoProducts.find((p) => p.slug === slug);
  
  return demoProduct || null;
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const registry = await fetchProductRegistry();
  if (!registry) {
    return buildDemoProducts().find((p) => p.id === id) || null;
  }

  const entry = registry.products.find((p) => p.id === id && p.status === 'active');
  if (!entry) {
    return buildDemoProducts().find((p) => p.id === id) || null;
  }

  return fetchProduct(entry.productCid);
}

/**
 * Get products by seller address
 */
export async function getProductsBySeller(sellerAddress: string): Promise<Product[]> {
  const registry = await fetchProductRegistry();
  if (!registry) {
    return buildDemoProducts().filter(
      (p) => p.sellerAddress.toLowerCase() === sellerAddress.toLowerCase()
    );
  }

  const sellerProducts = registry.products.filter(
    (p) => p.sellerAddress.toLowerCase() === sellerAddress.toLowerCase()
  );

  const products: Product[] = [];
  for (const entry of sellerProducts) {
    const product = await fetchProduct(entry.productCid);
    if (product) {
      products.push(product);
    }
  }

  return products;
}

/**
 * Create new product
 */
export async function createProduct(
  productData: Omit<Product, 'id' | 'slug' | 'createdAt' | 'purchaseCount' | 'listingFeePaid'>,
  listingFeeTxHash: string
): Promise<{ product: Product; registryCid: string } | null> {
  try {
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

    return { product: updated, registryCid };
  } catch (error) {
    console.error('Failed to update product:', error);
    return null;
  }
}
