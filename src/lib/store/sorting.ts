/**
 * Product Sorting Logic
 * Client-side sorting for products
 */

import type { Product } from './types';

export type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'popular';

/**
 * Sort products
 */
export function sortProducts(products: Product[], sortBy: SortOption): Product[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'newest':
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'oldest':
      sorted.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case 'price-low':
      sorted.sort((a, b) => a.priceKAS - b.priceKAS);
      break;
    case 'price-high':
      sorted.sort((a, b) => b.priceKAS - a.priceKAS);
      break;
    case 'popular':
      sorted.sort((a, b) => b.purchaseCount - a.purchaseCount);
      break;
    default:
      // Default to newest
      sorted.sort((a, b) => b.createdAt - a.createdAt);
  }

  return sorted;
}
