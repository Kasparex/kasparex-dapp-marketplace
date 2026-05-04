import { MINECORE_BATTERIES, MINECORE_MACHINES, MINECORE_PLANT_BASE_POWER_UNITS, MINECORE_POWER_NODES } from './config';
import type { MinecoreBatteryId, MinecorePowerNodeId, PlantSetup, PlantType } from './types';

export function getPlantBatterySlotCount(plantType: PlantType): number {
  return Math.max(1, MINECORE_PLANT_BASE_POWER_UNITS[plantType] ?? 1);
}

/** Reactor install slots mirror reserve-unit / battery pillar count per tier. */
export function getPlantPowerNodeSlotCount(plantType: PlantType): number {
  return getPlantBatterySlotCount(plantType);
}

/**
 * Pad reactor ids to plant tier slot count. Hydrate may pass legacy `powerNodeId` on interim objects.
 */
export function normalizePowerNodeIds(
  setup: PlantSetup & { powerNodeId?: MinecorePowerNodeId | null },
  plantType: PlantType,
): (MinecorePowerNodeId | null)[] {
  const n = getPlantPowerNodeSlotCount(plantType);
  const legacy =
    setup.powerNodeId != null && MINECORE_POWER_NODES[setup.powerNodeId] ? setup.powerNodeId : null;
  const raw = Array.isArray(setup.powerNodeIds) ? setup.powerNodeIds : null;
  const fromRaw =
    raw && raw.length > 0
      ? raw.map((x) => (x != null && MINECORE_POWER_NODES[x] ? x : null))
      : null;
  return Array.from({ length: n }, (_, i) => {
    if (fromRaw && i < fromRaw.length) return fromRaw[i] ?? null;
    if (legacy != null && !fromRaw && i === 0) return legacy;
    return null;
  });
}

/**
 * Pads or trims the battery id list to the plant’s power-unit slot count. Legacy `batteryId` in JSON
 * (hydrate) is merged in before this runs when `setup.batteryIds` is empty.
 */
export function normalizeBatteryIds(setup: PlantSetup, plantType: PlantType): (MinecoreBatteryId | null)[] {
  const n = getPlantBatterySlotCount(plantType);
  if (Array.isArray(setup.batteryIds) && setup.batteryIds.length > 0) {
    return Array.from({ length: n }, (_, i) => (i < setup.batteryIds!.length ? (setup.batteryIds![i] ?? null) : null));
  }
  return Array.from({ length: n }, () => null);
}

export function hasInstalledBattery(setup: PlantSetup, plantType: PlantType): boolean {
  return normalizeBatteryIds(setup, plantType).some(Boolean);
}

/**
 * Per-slot full charge (ms) after machine budget mult; 0 for empty slot.
 */
export function getMaxChargePerSlotMs(
  setup: PlantSetup,
  plantType: PlantType,
  /** Reserved: was Workers-tab NFT bonus ms; kept for signature compatibility (always 0). */
  extraMsPerSlot = 0,
): number[] {
  const ids = normalizeBatteryIds(setup, plantType);
  const mult = setup.machineId ? (MINECORE_MACHINES[setup.machineId]?.powerBudgetMultiplier ?? 1) : 1;
  return ids.map((id) => {
    if (!id) return 0;
    const base = MINECORE_BATTERIES[id]?.chargeCapacityMs ?? 0;
    const cap = Math.max(0, Math.floor(base * mult));
    const extra = extraMsPerSlot > 0 ? Math.floor(extraMsPerSlot) : 0;
    return cap + extra;
  });
}

export function sumChargeMs(s: number[]): number {
  return s.reduce((a, b) => a + b, 0);
}

/** Average efficiency of non-null installed batteries; 1 if none. */
export function averageBatteryEfficiency(setup: PlantSetup, plantType: PlantType): number {
  const ids = normalizeBatteryIds(setup, plantType).filter(Boolean) as MinecoreBatteryId[];
  if (ids.length === 0) return 1;
  let t = 0;
  for (const id of ids) {
    t += MINECORE_BATTERIES[id]?.efficiency ?? 1;
  }
  return t / ids.length;
}

/**
 * Sequentially drain (waterfall) from slot 0, then 1, …
 */
export function drainWaterfallRemaining(charges: number[], drain: number): number[] {
  let d = Math.max(0, drain);
  return charges.map((c) => {
    if (d <= 0) return c;
    const take = Math.min(c, d);
    d -= take;
    return c - take;
  });
}

/** Fill from slot 0 up to per-slot max until `targetTotal` charge is placed. */
export function distributeWaterfallToMax(targetTotal: number, maxPerSlot: number[]): number[] {
  let left = Math.max(0, Math.floor(targetTotal));
  return maxPerSlot.map((m) => {
    const cap = Math.max(0, m);
    const t = Math.min(cap, left);
    left -= t;
    return t;
  });
}

export function ensureBatterySlotChargeLength(charges: number[] | undefined, len: number, fill = 0): number[] {
  const a = Array.isArray(charges) ? [...charges] : [];
  return Array.from({ length: len }, (_, i) => (i < a.length && typeof a[i] === 'number' ? a[i] : fill));
}
