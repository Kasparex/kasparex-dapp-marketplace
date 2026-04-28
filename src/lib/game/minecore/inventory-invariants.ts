import type {
  MinecoreBatteryId,
  MinecoreMachineId,
  MinecoreModuleId,
  MinecoreState,
  MinecoreWorkerId,
  PlantSlotState,
} from './types';
import { getPlantBatterySlotCount } from './battery-utils';
import { normalizePlantSetup } from './asset-usage';

function cloneSlots(slots: PlantSlotState[]): PlantSlotState[] {
  return slots.map((s) => ({
    ...s,
    setup: {
      ...s.setup,
      batteryIds: [...(s.setup.batteryIds ?? [])],
      moduleIds: [...s.setup.moduleIds],
    },
    cycle: s.cycle ? { ...s.cycle } : null,
    batterySlotChargeMs: [...(s.batterySlotChargeMs ?? [])],
  }));
}

/**
 * Clamp plant assignments so unlocked setups never exceed owned inventory per asset id.
 * Fixes stale/corrupt saves (and legacy bugs) where multiple plants held the same rig/worker
 * while inventory math treated every slot as needing a separate owned unit — blocking swaps/removes.
 */
export function enforcePlantInventoryInvariants(state: MinecoreState): MinecoreState {
  const plantSlots = cloneSlots(state.plantSlots);

  const MACHINE_IDS = Object.keys(state.owned.machines) as MinecoreMachineId[];
  for (const mid of MACHINE_IDS) {
    const owned = Math.max(0, state.owned.machines[mid] ?? 0);
    const indices = plantSlots
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.unlocked && p.setup.machineId === mid)
      .map(({ i }) => i)
      .sort((a, b) => b - a);
    while (indices.length > owned) {
      const idx = indices.shift();
      if (idx === undefined) break;
      plantSlots[idx].setup.machineId = null;
    }
  }

  const WORKER_IDS = Object.keys(state.owned.workers) as MinecoreWorkerId[];
  for (const wid of WORKER_IDS) {
    const owned = Math.max(0, state.owned.workers[wid] ?? 0);
    const indices = plantSlots
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.unlocked && p.setup.workerId === wid)
      .map(({ i }) => i)
      .sort((a, b) => b - a);
    while (indices.length > owned) {
      const idx = indices.shift();
      if (idx === undefined) break;
      plantSlots[idx].setup.workerId = null;
    }
  }

  const BATTERY_IDS = Object.keys(state.owned.batteries) as MinecoreBatteryId[];
  for (const bid of BATTERY_IDS) {
    const owned = Math.max(0, state.owned.batteries[bid] ?? 0);
    const placements: { si: number; bi: number }[] = [];
    plantSlots.forEach((p, si) => {
      if (!p.unlocked) return;
      const n = getPlantBatterySlotCount(p.type);
      for (let bi = 0; bi < n; bi++) {
        if ((p.setup.batteryIds[bi] ?? null) === bid) placements.push({ si, bi });
      }
    });
    placements.sort((a, b) => (a.si !== b.si ? b.si - a.si : b.bi - a.bi));
    while (placements.length > owned) {
      const pl = placements.shift();
      if (!pl) break;
      plantSlots[pl.si].setup.batteryIds[pl.bi] = null;
    }
  }

  const MODULE_IDS = Object.keys(state.owned.modules) as MinecoreModuleId[];
  for (const modId of MODULE_IDS) {
    const owned = Math.max(0, state.owned.modules[modId] ?? 0);
    function countMod(): number {
      return plantSlots.reduce(
        (n, p) =>
          n + (p.unlocked ? p.setup.moduleIds.filter((m) => m === modId).length : 0),
        0,
      );
    }
    while (countMod() > owned) {
      let removed = false;
      for (let si = plantSlots.length - 1; si >= 0 && !removed; si--) {
        const p = plantSlots[si];
        if (!p.unlocked) continue;
        const idx = p.setup.moduleIds.lastIndexOf(modId);
        if (idx >= 0) {
          p.setup.moduleIds.splice(idx, 1);
          removed = true;
        }
      }
      if (!removed) break;
    }
  }

  const normalized = plantSlots.map((p) => ({
    ...p,
    setup: normalizePlantSetup(p.type, p.setup),
  }));

  return { ...state, plantSlots: normalized };
}
