import type { Product } from './types';

export function parseStoreProductTags(raw: string): string[] {
  return raw
    .split(/[,#]/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

export function normalizeStoreProductTags(tags?: string[]): string[] {
  if (!tags?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const normalized = tag.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out.slice(0, 12);
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
