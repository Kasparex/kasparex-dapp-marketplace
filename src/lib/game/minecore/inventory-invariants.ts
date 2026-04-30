import type {
  MinecoreBatteryId,
  MinecoreMachineId,
  MinecoreModuleId,
  MinecoreState,
  PlantSlotState,
} from './types';
import { MINECORE_POWER_NODE_IDS } from './types';
import { getPlantBatterySlotCount } from './battery-utils';
import { normalizePlantSetup } from './asset-usage';

function cloneSlots(slots: PlantSlotState[]): PlantSlotState[] {
  return slots.map((s) => ({
    ...s,
    setup: {
      ...s.setup,
      batteryIds: [...(s.setup.batteryIds ?? [])],
      moduleIds: [...s.setup.moduleIds],
      workerNftDeckSlotIndices: [...(s.setup.workerNftDeckSlotIndices ?? [])],
    },
    cycle: s.cycle ? { ...s.cycle } : null,
    batterySlotChargeMs: [...(s.batterySlotChargeMs ?? [])],
  }));
}

/**
 * Clamp plant assignments so unlocked setups never exceed owned inventory per asset id.
 * Fixes stale/corrupt saves (and legacy bugs) where multiple plants held the same rig/battery
 * while inventory math treated every slot as needing a separate owned unit - blocking swaps/removes.
 *
 * LEGACY (fabricated crew): older saves used `setup.workerId` with `owned.workers` and were clamped
 * here - see git history / `enforcePlantInventoryInvariants` blame. Plants now reference
 * `workerNftDeckSlotIndices` into `nftSlots` (Worker / Operator / Foreman NFT decks).
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

  for (const nid of MINECORE_POWER_NODE_IDS) {
    const owned = Math.max(0, state.owned.nodes?.[nid] ?? 0);
    const indices = plantSlots
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.unlocked && p.setup.powerNodeId === nid)
      .map(({ i }) => i)
      .sort((a, b) => b - a);
    while (indices.length > owned) {
      const idx = indices.shift();
      if (idx === undefined) break;
      plantSlots[idx].setup.powerNodeId = null;
    }
  }

  const nftSlots = state.nftSlots ?? [];
  const seenMiningDeckIdx = new Set<number>();
  for (let si = 0; si < plantSlots.length; si++) {
    const p = plantSlots[si];
    if (!p.unlocked) continue;
    const indices = [...(p.setup.workerNftDeckSlotIndices ?? [])];
    let changed = false;
    const next = indices.map((deckIdx) => {
      if (deckIdx == null) return null;
      const deck = nftSlots[deckIdx];
      const ok =
        deck &&
        (deck.type === 'worker' || deck.type === 'operator' || deck.type === 'foreman') &&
        deck.nftId != null &&
        deck.collection;
      if (!ok) {
        changed = true;
        return null;
      }
      if (seenMiningDeckIdx.has(deckIdx)) {
        changed = true;
        return null;
      }
      seenMiningDeckIdx.add(deckIdx);
      return deckIdx;
    });
    if (changed || next.length !== indices.length) {
      plantSlots[si].setup.workerNftDeckSlotIndices = next;
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
