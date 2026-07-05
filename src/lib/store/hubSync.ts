'use client';

import type { Product } from '@/lib/store/types';
import { mergeStoreProducts } from '@/lib/hub/contentMerge';

const STORAGE_KEY = 'kasparex_hub_store_products';

function readLocal(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(products: Product[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent('hub-store-products-updated'));
}

export function getHubSyncedStoreProducts(): Product[] {
  return readLocal().filter((p) => p.status === 'active');
}

export function importRemoteStoreProducts(remote: Product[]): void {
  if (typeof window === 'undefined' || !remote.length) return;
  const merged = mergeStoreProducts(readLocal(), remote);
  writeLocal(merged);
}

export function upsertHubStoreProduct(product: Product): void {
  const merged = mergeStoreProducts(readLocal(), [product]);
  writeLocal(merged);
}

export function removeHubStoreProduct(id: string): void {
  writeLocal(readLocal().filter((p) => p.id !== id));
}
