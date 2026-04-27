import { minecoreUtcDayKey } from './plant-economy';
import type { PlantSlotState } from './types';

export function normalizePlantDailyCap(slot: PlantSlotState, at: number): void {
  const dk = minecoreUtcDayKey(at);
  if (slot.dailyCapDayKey !== dk) {
    slot.dailyCapDayKey = dk;
    slot.dailyCapMinedDiamonds = 0;
  }
}

/** Credit diamonds already accounted toward the UTC-day cap (extract / refine from plant). */
export function creditPlantDailyCap(slot: PlantSlotState, amount: number, at: number): void {
  if (amount <= 0) return;
  normalizePlantDailyCap(slot, at);
  slot.dailyCapMinedDiamonds += amount;
}

export function normalizeAllPlantDailyCaps(slots: PlantSlotState[], at: number): void {
  for (const s of slots) normalizePlantDailyCap(s, at);
}

/** Immutable UTC-day rollover for derived UI state (does not mutate). */
export function rollPlantDailyCapIfNeeded(slot: PlantSlotState, now: number): PlantSlotState {
  const dk = minecoreUtcDayKey(now);
  if (slot.dailyCapDayKey === dk) return slot;
  return { ...slot, dailyCapDayKey: dk, dailyCapMinedDiamonds: 0 };
}
