import { MINECORE_PLANT_RECHARGE_COST_KAS } from './config';
import type { MinecoreComputeContext } from './compute-context';
import { getMaxChargePerSlotMs, normalizeBatteryIds } from './battery-utils';
import { computeMinecoreBatteryBonusMsPerSlot } from './nft-deck-benefits';
import type { MinecoreState, PlantSlotState } from './types';

/** Hours of effective slot capacity covered by `MINECORE_PLANT_RECHARGE_COST_KAS` before hourly surcharges apply. */
export const MINECORE_RECHARGE_INCLUDED_HOURS = 1;

/** Added list KAS per started hour beyond `MINECORE_RECHARGE_INCLUDED_HOURS`, from effective max runtime for that pillar. */
export const MINECORE_RECHARGE_EXTRA_KAS_PER_HOUR = 1;

const MS_PER_HOUR = 3_600_000;

export function listKasForBatterySlotRecharge(
  state: MinecoreState,
  slot: PlantSlotState,
  batterySlotIndex: number,
  ctx?: MinecoreComputeContext,
): number {
  const bonusMs = computeMinecoreBatteryBonusMsPerSlot(state, ctx);
  const caps = getMaxChargePerSlotMs(slot.setup, slot.type, bonusMs);
  const ms = caps[batterySlotIndex] ?? 0;
  const hours = ms / MS_PER_HOUR;
  const extraWholeHours = Math.max(0, Math.ceil(hours - MINECORE_RECHARGE_INCLUDED_HOURS - 1e-9));
  return MINECORE_PLANT_RECHARGE_COST_KAS + extraWholeHours * MINECORE_RECHARGE_EXTRA_KAS_PER_HOUR;
}

export function sumListKasForBatterySlotRecharge(
  state: MinecoreState,
  slot: PlantSlotState,
  indexes: readonly number[],
  ctx?: MinecoreComputeContext,
): number {
  let sum = 0;
  const uniq = [...new Set(indexes)].sort((a, b) => a - b);
  for (const i of uniq) {
    sum += listKasForBatterySlotRecharge(state, slot, i, ctx);
  }
  return sum;
}

/** Paid full refill (`RefillBattery`): sum each populated battery pillar’s list price. */
export function sumListKasForPlantBatteryRefill(
  state: MinecoreState,
  slot: PlantSlotState,
  ctx?: MinecoreComputeContext,
): number {
  const ids = normalizeBatteryIds(slot.setup, slot.type);
  const idxs: number[] = [];
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] != null) idxs.push(i);
  }
  return sumListKasForBatterySlotRecharge(state, slot, idxs, ctx);
}
