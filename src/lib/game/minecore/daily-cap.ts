import { MINECORE_DAY_MS } from './config';
import type { PlantSlotState } from './types';

/**
 * Advance rolling 24h window (from plant activation) and reset credited progress when a full period elapses.
 */
export function normalizePlantRollingDailyCap(slot: PlantSlotState, at: number): void {
  if (!slot.unlocked || slot.rollingCapWindowStartMs <= 0) return;
  const elapsed = at - slot.rollingCapWindowStartMs;
  if (elapsed < MINECORE_DAY_MS) return;
  const periods = Math.floor(elapsed / MINECORE_DAY_MS);
  slot.rollingCapWindowStartMs += periods * MINECORE_DAY_MS;
  slot.dailyCapMinedDiamonds = 0;
}

/** Credit diamonds toward the current rolling 24h cap (extract / refine from plant). */
export function creditPlantDailyCap(slot: PlantSlotState, amount: number, at: number): void {
  if (amount <= 0) return;
  normalizePlantRollingDailyCap(slot, at);
  slot.dailyCapMinedDiamonds += amount;
}

export function normalizeAllPlantRollingDailyCaps(slots: PlantSlotState[], at: number): void {
  for (const s of slots) normalizePlantRollingDailyCap(s, at);
}

/** Immutable rolling window step for derived UI (does not mutate). */
export function rollPlantRollingDailyCapIfNeeded(slot: PlantSlotState, now: number): PlantSlotState {
  if (!slot.unlocked || slot.rollingCapWindowStartMs <= 0) return slot;
  const elapsed = now - slot.rollingCapWindowStartMs;
  if (elapsed < MINECORE_DAY_MS) return slot;
  const periods = Math.floor(elapsed / MINECORE_DAY_MS);
  return {
    ...slot,
    rollingCapWindowStartMs: slot.rollingCapWindowStartMs + periods * MINECORE_DAY_MS,
    dailyCapMinedDiamonds: 0,
  };
}
