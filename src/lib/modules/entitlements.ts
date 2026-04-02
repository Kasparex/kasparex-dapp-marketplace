import type { ModuleId } from './types';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { fetchPurchaseRegistry } from '@/lib/store/ipfs-registry';

/**
 * Mapping from store product IDs to module entitlements.
 * Keep empty until module SKUs are published in the Store registry.
 */
export const STORE_PRODUCT_ID_TO_MODULE: Partial<Record<string, ModuleId>> = {};

export type StoreModuleEntitlementsIndex = {
  unlockedByWallet: Record<string, Set<ModuleId>>;
};

export async function buildStoreModuleEntitlementsIndex(): Promise<StoreModuleEntitlementsIndex> {
  const unlockedByWallet: Record<string, Set<ModuleId>> = {};
  const registry = await fetchPurchaseRegistry();
  const purchases = registry?.purchases ?? [];
  for (const p of purchases) {
    const moduleId = STORE_PRODUCT_ID_TO_MODULE[p.productId];
    if (!moduleId) continue;
    const buyer = String(p.buyerAddress ?? '').trim();
    if (!buyer) continue;
    const key = buyer.toLowerCase();
    (unlockedByWallet[key] ??= new Set()).add(moduleId);
  }
  return { unlockedByWallet };
}

export function isModuleUnlockedByStore(
  index: StoreModuleEntitlementsIndex,
  kaspaAddress: string,
  moduleId: ModuleId
): boolean {
  if (!kaspaAddress) return false;
  const key = kaspaAddress.toLowerCase();
  return Boolean(index.unlockedByWallet[key]?.has(moduleId));
}

/**
 * For vault unlocks, we treat a vault offer ID equal to `moduleId` as the entitlement key.
 * This lets us reuse the existing Chronicles vault unlock verification and the same treasury.
 */
export function moduleIdFromVaultOfferId(offerId: string): ModuleId | null {
  const t = String(offerId ?? '').trim();
  if (t === 'confirmed_reads' || t === 'nft_slots') return t;
  return null;
}

export function normalizeKaspaAddressLoose(address: string): string {
  try {
    return normalizeKaspaAddress(address);
  } catch {
    return address.trim();
  }
}

