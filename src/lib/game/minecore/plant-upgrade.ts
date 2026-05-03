import { MINECORE_PLANT_MAX_DIAMONDS_PER_24H, MINECORE_PLANT_TYPE_ORDER } from './config';
import type { PlantSlotState, PlantType } from './types';

/**
 * Fraction of {@link MINECORE_PLANT_MAX_DIAMONDS_PER_24H} for the plant’s **current** tier that must be
 * reached (once, tracked toward rolling-cap progress including banked + live) to unlock the **next** tier purchase.
 */
export const MINECORE_PLANT_UPGRADE_CAP_MILESTONE_FRAC = 0.1;

export function plantTierUnlockDiamondThreshold(plantType: PlantType): number {
  const max = MINECORE_PLANT_MAX_DIAMONDS_PER_24H[plantType] ?? 0;
  return Math.max(1, Math.ceil(max * MINECORE_PLANT_UPGRADE_CAP_MILESTONE_FRAC));
}

export function nextPlantTier(plantType: PlantType): PlantType | null {
  const order = MINECORE_PLANT_TYPE_ORDER;
  const i = order.indexOf(plantType);
  if (i < 0 || i >= order.length - 1) return null;
  return order[i + 1] ?? null;
}

export function plantTierOrderIndex(plantType: PlantType): number {
  return MINECORE_PLANT_TYPE_ORDER.indexOf(plantType);
}

export function tierCapMilestoneRecorded(slot: Pick<PlantSlotState, 'type' | 'plantTierCapMilestonesPassed'>): boolean {
  return Boolean(slot.plantTierCapMilestonesPassed?.includes(slot.type));
}
