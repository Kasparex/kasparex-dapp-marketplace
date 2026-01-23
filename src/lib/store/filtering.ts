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
