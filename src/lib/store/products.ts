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
    return demoProducts;
  }

  // Fetch full product data for each entry
  const products: Product[] = [];
  for (const entry of registry.products) {
    // Backward/forward-compatible: treat any non-archived entry as visible
    if ((entry as { status?: string }).status !== 'archived') {
      const product = await fetchProduct(entry.productCid);
      if (product) {
        products.push(product);
      } else {
        // Do not drop registry-visible products just because the IPFS JSON fetch failed.
        // Create a minimal placeholder so the listing stays complete.
        products.push({
          id: entry.id,
          slug: entry.slug,
          title: `[Unavailable] ${entry.slug}`,
          description: 'Product metadata is temporarily unavailable. Please retry later.',
          sellerAddress: entry.sellerAddress,
          priceKAS: entry.priceKAS,
          network: entry.network,
          category: entry.category,
          assetCids: [],
          thumbnailCid: entry.thumbnailCid,
          status: 'active',
          listingFeePaid: true,
          createdAt: entry.createdAt,
          purchaseCount: entry.purchaseCount,
        });
      }
    }
  }

  // Merge with demo products, avoiding duplicates by slug
  const productMap = new Map<string, Product>();
  
  // Add demo products first
  demoProducts.forEach(p => productMap.set(p.slug, p));
  
  // Add registry products (will overwrite demo products with same slug)
  products.forEach(p => productMap.set(p.slug, p));
  
  return Array.from(productMap.values());
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  // Try to fetch from registry (checks localStorage first for new products)
  const registry = await fetchProductRegistry();
  
  if (registry && registry.products.length > 0) {
    const entry = registry.products.find(
      (p) => p.slug === slug && ((p as { status?: string }).status !== 'archived')
    );
    
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

  const entry = registry.products.find(
    (p) => p.id === id && ((p as { status?: string }).status !== 'archived')
  );
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
 * Archive product
 */
export async function archiveProduct(
  productId: string,
  sellerAddress: string
): Promise<boolean> {
  try {
    const registry = await fetchProductRegistry();
    if (!registry) {
      return false;
    }

    const entry = registry.products.find(
      (p) => p.id === productId && p.sellerAddress.toLowerCase() === sellerAddress.toLowerCase()
    );
    if (!entry) {
      return false;
    }

    entry.status = 'archived';
    registry.updatedAt = Date.now();

    // Upload updated registry
    const registryCid = await uploadProductRegistry(registry);
    return !!registryCid;
  } catch (error) {
    console.error('Failed to archive product:', error);
    return false;
  }
}
