import type { AdEntry } from './types';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

const ADS_START_SLACK_MS = 5 * 60 * 1000;

export function filterActiveAdsForSlot(ads: AdEntry[], slotId: string): AdEntry[] {
  const nowMs = Date.now();
  return ads
    .filter(
      (ad) =>
        ad.slotId === slotId &&
        new Date(ad.startTime).getTime() - ADS_START_SLACK_MS <= nowMs &&
        new Date(ad.endTime).getTime() > nowMs
    )
    .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));
}

export function getRandomActiveAdForSlotFromList(ads: AdEntry[], slotId: string): AdEntry | null {
  const list = filterActiveAdsForSlot(ads, slotId);
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/** Distinct cells in use (avoids treating duplicate slotIndex rows as filling the slot). */
export function countActiveForSlot(ads: AdEntry[], slotId: string): number {
  const list = filterActiveAdsForSlot(ads, slotId);
  return new Set(list.map((a) => a.slotIndex ?? 0)).size;
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
