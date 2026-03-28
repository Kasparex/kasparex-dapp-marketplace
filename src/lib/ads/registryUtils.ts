import type { AdEntry } from './types';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

export function filterActiveAdsForSlot(ads: AdEntry[], slotId: string): AdEntry[] {
  const nowMs = Date.now();
  return ads
    .filter(
      (ad) =>
        ad.slotId === slotId &&
        new Date(ad.startTime).getTime() <= nowMs &&
        new Date(ad.endTime).getTime() > nowMs
    )
    .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));
}

export function getRandomActiveAdForSlotFromList(ads: AdEntry[], slotId: string): AdEntry | null {
  const list = filterActiveAdsForSlot(ads, slotId);
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export function countActiveForSlot(ads: AdEntry[], slotId: string): number {
  return filterActiveAdsForSlot(ads, slotId).length;
}

/** Ads paid by this L1 address (normalized compare on payerL1) */
export function filterAdsByPayer(ads: AdEntry[], payerKaspaAddress: string | null): AdEntry[] {
  if (!payerKaspaAddress?.trim()) return [];
  let pNorm: string;
  try {
    pNorm = normalizeKaspaAddress(payerKaspaAddress.trim());
  } catch {
    return [];
  }
  return ads.filter((ad) => {
    if (!ad.payerL1) return false;
    try {
      return normalizeKaspaAddress(ad.payerL1) === pNorm;
    } catch {
      return false;
    }
  });
}
