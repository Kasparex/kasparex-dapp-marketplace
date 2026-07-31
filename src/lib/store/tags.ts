import type { Product } from './types';

import { HUB_MAX_LISTING_TAGS, normalizeHubTags } from '@/lib/hub/suggestedTags';

export function parseStoreProductTags(raw: string): string[] {
  return normalizeHubTags(
    raw.split(/[,#]/).map((t) => t.trim()),
    HUB_MAX_LISTING_TAGS,
  );
}

export function normalizeStoreProductTags(tags?: string[]): string[] {
  return normalizeHubTags(tags ?? [], HUB_MAX_LISTING_TAGS);
}

export function getProductTagsFromCatalog(products: Product[]): string[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    for (const tag of product.tags ?? []) {
      const normalized = tag.trim().toLowerCase();
      if (!normalized) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }
  return [...counts.keys()].sort((a, b) => {
    const diff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
}

export function productMatchesTags(product: Product, selectedTags: string[]): boolean {
  if (selectedTags.length === 0) return true;
  const productTags = new Set(normalizeStoreProductTags(product.tags));
  return selectedTags.some((tag) => productTags.has(tag.trim().toLowerCase()));
}
