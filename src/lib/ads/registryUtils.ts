import type { AdEntry } from './types';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { ADS_START_SLACK_MS } from '@/lib/ads/adActiveWindow';

/** Legacy rail slot merged into Games Halo for display and capacity. */
function slotIdsMatchingPlacement(slotId: string): string[] {
  if (slotId === 'HALO_GAMES_RIGHT') return ['HALO_GAMES_RIGHT', 'GAMES_PLAY_RAIL_RIGHT'];
  return [slotId];
}

function matchesPlacement(ad: AdEntry, slotId: string): boolean {
  return slotIdsMatchingPlacement(slotId).includes(ad.slotId);
}

export function filterActiveAdsForSlot(ads: AdEntry[], slotId: string): AdEntry[] {
  const nowMs = Date.now();
  return ads
    .filter(
      (ad) =>
        matchesPlacement(ad, slotId) &&
        new Date(ad.startTime).getTime() - ADS_START_SLACK_MS <= nowMs &&
        new Date(ad.endTime).getTime() > nowMs
    )
    .sort((a, b) => {
      const ia = a.slotIndex ?? 0;
      const ib = b.slotIndex ?? 0;
      if (ia !== ib) return ia - ib;
      if (a.slotId === 'HALO_GAMES_RIGHT' && b.slotId !== 'HALO_GAMES_RIGHT') return -1;
      if (b.slotId === 'HALO_GAMES_RIGHT' && a.slotId !== 'HALO_GAMES_RIGHT') return 1;
      return 0;
    });
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

/** Lowest free cell index, or 0 if all occupied (caller should check capacity). */
export function firstFreeSlotIndex(ads: AdEntry[], slotId: string, maxAds: number): number {
  const occupied = new Set(filterActiveAdsForSlot(ads, slotId).map((a) => a.slotIndex ?? 0));
  for (let i = 0; i < maxAds; i++) {
    if (!occupied.has(i)) return i;
  }
  return 0;
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
