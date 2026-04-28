'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MiningSlot } from '@/lib/game/engine';
import { hydrateTyconState } from '@/lib/game/engine/apply-event';
import { hydrateMinecoreState } from '@/lib/game/minecore/hydrate';
import { MINECORE_STORAGE_PREFIX } from '@/lib/game/minecore/config';
import { buildGlobalNftRefsForMinecoreWorkers } from '@/lib/nft/kasparexMergedGlobalNftRefs';

const TYCON_STORAGE_KEY = 'diamond-veins-state';

export function readMinecoreNftSlotsFromStorage(payerKaspa: string | undefined): MiningSlot[] {
  if (typeof window === 'undefined' || !payerKaspa?.trim()) return [];
  try {
    const raw = localStorage.getItem(`${MINECORE_STORAGE_PREFIX}:${payerKaspa.trim()}`);
    if (!raw) return [];
    return hydrateMinecoreState(JSON.parse(raw)).nftSlots ?? [];
  } catch {
    return [];
  }
}

export function readTyconSlotsFromStorage(): MiningSlot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TYCON_STORAGE_KEY);
    if (!raw) return [];
    return hydrateTyconState(JSON.parse(raw)).slots ?? [];
  } catch {
    return [];
  }
}

/**
 * Chronicles + Minecore worker deck + Diamond Mining (Tycon) slots.
 * Omits `minecoreNftSlots` / `tyconSlots` to read the other game from localStorage (for cross-game lock UIs).
 */
export function useKasparexGlobalNftUsage(opts: {
  payerKaspa: string | undefined;
  minecoreNftSlots?: MiningSlot[];
  tyconSlots?: MiningSlot[];
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener('kasparex-nft-usage', bump);
    window.addEventListener('chronicles-lb-local', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('kasparex-nft-usage', bump);
      window.removeEventListener('chronicles-lb-local', bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  return useMemo(() => {
    const mc =
      opts.minecoreNftSlots !== undefined ? opts.minecoreNftSlots : readMinecoreNftSlotsFromStorage(opts.payerKaspa);
    const ty = opts.tyconSlots !== undefined ? opts.tyconSlots : readTyconSlotsFromStorage();
    return buildGlobalNftRefsForMinecoreWorkers({
      payerKaspa: opts.payerKaspa,
      minecoreNftSlots: mc,
      tyconSlots: ty,
    });
  }, [opts.payerKaspa, opts.minecoreNftSlots, opts.tyconSlots, tick]);
}
