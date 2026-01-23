/**
 * Product Filtering Logic
 * Client-side filtering for products
 */

import type { Product, ProductCategory, ProductNetwork } from './types';

export interface ProductFilters {
  category?: ProductCategory | 'all';
  network?: ProductNetwork | 'all';
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Filter products based on filters
 */
export function filterProducts(
  products: Product[],
  filters: ProductFilters
): Product[] {
  return products.filter((product) => {
    // Category filter
    if (filters.category && filters.category !== 'all') {
      if (product.category !== filters.category) {
        return false;
      }
    }

    // Network filter
    if (filters.network && filters.network !== 'all') {
      if (product.network !== filters.network) {
        return false;
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        product.title.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower);
      if (!matchesSearch) {
        return false;
      }
    }

    // Price range filter
    if (filters.minPrice !== undefined && product.priceKAS < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && product.priceKAS > filters.maxPrice) {
      return false;
    }

    return true;
  });
}

/**
 * Get available categories from products
 */
export function getAvailableCategories(products: Product[]): ProductCategory[] {
  const categories = new Set<ProductCategory>();
  products.forEach((product) => {
    categories.add(product.category);
  });
  return Array.from(categories).sort();
}

/**
 * Get category counts from products
 */
export function getCategoryCounts(products: Product[]): Record<ProductCategory, number> {
  const counts: Record<ProductCategory, number> = {
    Software: 0,
    Art: 0,
    Music: 0,
    Templates: 0,
    Other: 0,
  };
  products.forEach((product) => {
    counts[product.category] = (counts[product.category] || 0) + 1;
  });
  return counts;
}

/**
 * Get network counts from products
 */
export function getNetworkCounts(products: Product[]): Record<ProductNetwork, number> {
  const counts: Record<ProductNetwork, number> = {
    L1: 0,
    L2: 0,
  };
  products.forEach((product) => {
    counts[product.network] = (counts[product.network] || 0) + 1;
  });
  return counts;
}
