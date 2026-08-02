'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MiningSlot } from '@/lib/game/engine';
import {
  buildKasparexGlobalNftUsage,
  readMinecoreNftSlotsFromMergedStorage,
  readTyconSlotsFromMergedStorage,
  readPrecisionOperativesFromStorage,
  readCipherWardensFromStorage,
  seedKnownSurfacesIntoRegistry,
  type CrewNftUsageSlot,
} from '@/lib/nft/kasparexMergedGlobalNftRefs';

export function readMinecoreNftSlotsFromStorage(payerKaspa: string | undefined): MiningSlot[] {
  return readMinecoreNftSlotsFromMergedStorage(payerKaspa);
}

/** Prefer payer-scoped Diamond Veins key. Address required for cross-game lock. */
export function readTyconSlotsFromStorage(payerKaspa?: string | undefined): MiningSlot[] {
  return readTyconSlotsFromMergedStorage(payerKaspa);
}

/**
 * Cross-game NFT lock: Minecore + Diamond Veins + Precision Click + Cipher Vaults.
 * HARD RULE: one NFT may occupy only one slot Hub-wide.
 * Omit a live slot list to read that game from localStorage.
 */
export function useKasparexGlobalNftUsage(opts: {
  payerKaspa: string | undefined;
  minecoreNftSlots?: MiningSlot[];
  tyconSlots?: MiningSlot[];
  precisionOperative?: CrewNftUsageSlot | CrewNftUsageSlot[];
  cipherWardenSlots?: CrewNftUsageSlot | CrewNftUsageSlot[];
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    seedKnownSurfacesIntoRegistry(opts.payerKaspa);
  }, [opts.payerKaspa]);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener('kasparex-nft-usage', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('kasparex-nft-usage', bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  return useMemo(() => {
    const mc =
      opts.minecoreNftSlots !== undefined
        ? opts.minecoreNftSlots
        : readMinecoreNftSlotsFromStorage(opts.payerKaspa);
    const ty =
      opts.tyconSlots !== undefined ? opts.tyconSlots : readTyconSlotsFromStorage(opts.payerKaspa);
    const pc =
      opts.precisionOperative !== undefined
        ? opts.precisionOperative
        : readPrecisionOperativesFromStorage(opts.payerKaspa);
    const cv =
      opts.cipherWardenSlots !== undefined
        ? opts.cipherWardenSlots
        : readCipherWardensFromStorage(opts.payerKaspa);
    return buildKasparexGlobalNftUsage({
      payerKaspa: opts.payerKaspa,
      minecoreNftSlots: mc,
      tyconSlots: ty,
      precisionOperative: pc,
      cipherWardenSlots: cv,
    });
  }, [
    opts.payerKaspa,
    opts.minecoreNftSlots,
    opts.tyconSlots,
    opts.precisionOperative,
    opts.cipherWardenSlots,
    tick,
  ]);
}
