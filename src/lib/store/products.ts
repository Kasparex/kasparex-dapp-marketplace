/**
 * Product Management Functions
 * IPFS-based product operations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  fetchProductRegistry,
  uploadProductRegistry,
  uploadProduct,
  fetchProduct,
  createEmptyProductRegistry,
} from './ipfs-registry';
import type { Product, ProductRegistry, ProductRegistryEntry } from './types';

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
  if (!registry) {
    return [];
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

  return products;
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const registry = await fetchProductRegistry();
  if (!registry) {
    return null;
  }

  const entry = registry.products.find((p) => p.slug === slug && p.status === 'active');
  if (!entry) {
    return null;
  }

  return fetchProduct(entry.productCid);
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const registry = await fetchProductRegistry();
  if (!registry) {
    return null;
  }

  const entry = registry.products.find((p) => p.id === id && p.status === 'active');
  if (!entry) {
    return null;
  }

  return fetchProduct(entry.productCid);
}

/**
 * Get products by seller address
 */
export async function getProductsBySeller(sellerAddress: string): Promise<Product[]> {
  const registry = await fetchProductRegistry();
  if (!registry) {
    return [];
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

    // Upload product to IPFS
    const productCid = await uploadProduct(product);
    if (!productCid) {
      throw new Error('Failed to upload product to IPFS');
    }

    // Fetch or create registry
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
