import type {
  MinecoreBatteryId,
  MinecoreBoostId,
  MinecoreMachineId,
  MinecoreModuleId,
  MinecoreState,
  PlantSetup,
  PlantSlotState,
} from './types';
import type { MiningSlot, MiningSlotType } from '@/lib/game/engine';
import { MINECORE_MAX_MODULES_BY_PLANT } from './config';
import { getPlantBatterySlotCount } from './battery-utils';

/** Pad battery slots + stable boost id so inventory math matches plant tier (fixes short/partial saves). */
export function normalizePlantSetup(type: PlantSlotState['type'], setup: PlantSetup): PlantSetup {
  const n = getPlantBatterySlotCount(type);
  const batteryIds = Array.from({ length: n }, (_, i) =>
    i < (setup.batteryIds?.length ?? 0) ? ((setup.batteryIds![i] ?? null) as MinecoreBatteryId | null) : null,
  );
  const widx =
    typeof setup.workerNftDeckSlotIndex === 'number' && Number.isFinite(setup.workerNftDeckSlotIndex)
      ? Math.max(0, Math.floor(setup.workerNftDeckSlotIndex))
      : null;
  return {
    machineId: setup.machineId,
    workerNftDeckSlotIndex: widx,
    moduleIds: [...setup.moduleIds],
    batteryIds,
    boostId: setup.boostId ?? 'none',
  };
}

/** Mirrors `InstallPart` `part` payload for hypothetical setup checks. */
export type InstallPartPayload =
  | { kind: 'machine'; id: MinecoreMachineId | null }
  | { kind: 'battery'; id: MinecoreBatteryId | null; batterySlotIndex?: number }
  | { kind: 'crewWorkerNftDeck'; deckSlotIndex: number | null }
  | { kind: 'modules'; ids: MinecoreModuleId[] }
  | { kind: 'boost'; id: MinecoreBoostId };

/** True when this plant points at a Workers-tab deck slot with a deployed Worker NFT. */
export function plantWorkerNftDeckAssignmentValid(state: MinecoreState, slot: PlantSlotState): boolean {
  const idx = slot.setup.workerNftDeckSlotIndex;
  if (idx == null || idx < 0) return false;
  const deck = state.nftSlots?.[idx];
  return Boolean(deck?.type === 'worker' && deck.nftId != null && deck.collection);
}

export function countWorkerNftDeckAssignmentsExcept(
  slots: PlantSlotState[],
  deckSlotIndex: number,
  exceptPlantSlotIndex: number,
): number {
  return slots.reduce(
    (n, p, i) =>
      n + (p.unlocked && i !== exceptPlantSlotIndex && p.setup.workerNftDeckSlotIndex === deckSlotIndex ? 1 : 0),
    0,
  );
}

/** Uses plantSlots array index (matches InstallPart slotIndex), not slot.index — avoids drift from persisted metadata. */
export function countMachinesAssignedExcept(slots: PlantSlotState[], id: MinecoreMachineId, exceptSlotIndex: number): number {
  return slots.reduce(
    (n, p, i) => n + (p.unlocked && i !== exceptSlotIndex && p.setup.machineId === id ? 1 : 0),
    0,
  );
}

/** Next setup after applying `InstallPart`-style payload (no battery rescaling). */
export function nextPlantSetupAfterInstallPart(slot: PlantSlotState, part: InstallPartPayload): PlantSetup {
  const setup: PlantSetup = {
    ...slot.setup,
    batteryIds: [...(slot.setup.batteryIds ?? [])],
    moduleIds: [...slot.setup.moduleIds],
  };
  if (part.kind === 'machine') {
    setup.machineId = part.id;
    return setup;
  }
  if (part.kind === 'battery') {
    const n = getPlantBatterySlotCount(slot.type);
    const idx =
      part.batterySlotIndex != null ? Math.max(0, Math.min(n - 1, Math.floor(part.batterySlotIndex))) : 0;
    const nextIds = Array.from({ length: n }, (_, i) =>
      (i < setup.batteryIds.length ? setup.batteryIds[i] : null) as MinecoreBatteryId | null
    );
    nextIds[idx] = part.id;
    setup.batteryIds = nextIds;
    return setup;
  }
  if (part.kind === 'crewWorkerNftDeck') {
    setup.workerNftDeckSlotIndex =
      part.deckSlotIndex == null ? null : Math.max(0, Math.floor(part.deckSlotIndex));
    return setup;
  }
  if (part.kind === 'modules') {
    const max = MINECORE_MAX_MODULES_BY_PLANT[slot.type];
    setup.moduleIds = slot.type === 'standard' ? [] : [...part.ids].slice(0, max);
    return setup;
  }
  if (part.kind === 'boost') {
    setup.boostId = part.id;
    return setup;
  }
  return setup;
}

/** True if assigning `pickId` to `batterySlotIndex` does not exceed owned inventory of that battery type. */
export function canAssignBatteryToPlantSlot(
  slots: PlantSlotState[],
  slotIndex: number,
  batterySlotIndex: number,
  pickId: MinecoreBatteryId | null,
  owned: number,
): boolean {
  if (pickId == null) return true;
  const slot = slots[slotIndex];
  if (!slot) return false;
  const oldVal = slot.setup.batteryIds?.[batterySlotIndex] ?? null;
  let total = countBatteriesAssigned(slots, pickId);
  if (oldVal === pickId) total -= 1;
  total += 1;
  return total <= owned;
}

/** Total assignments per ID across unlocked plants must not exceed owned counts. */
export function inventoryAllowsPlantSetup(state: MinecoreState, slotIndex: number, nextSetup: PlantSetup): boolean {
  const target = state.plantSlots[slotIndex];
  if (!target) return false;
  const normalizedNext = normalizePlantSetup(target.type, nextSetup);
  const hypotheticalSlots = state.plantSlots.map((p, i) => ({
    ...p,
    setup: normalizePlantSetup(p.type, i === slotIndex ? normalizedNext : p.setup),
  }));

  const machineIds = new Set<MinecoreMachineId>();
  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    if (p.setup.machineId) machineIds.add(p.setup.machineId);
  }
  for (const id of machineIds) {
    const assigned = hypotheticalSlots.reduce(
      (n, p) => n + (p.unlocked && p.setup.machineId === id ? 1 : 0),
      0,
    );
    if (assigned > (state.owned.machines[id] ?? 0)) return false;
  }

  const batTotals = new Map<MinecoreBatteryId, number>();
  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    const n = getPlantBatterySlotCount(p.type);
    for (let bi = 0; bi < n; bi++) {
      const bid = p.setup.batteryIds[bi] ?? null;
      if (bid) batTotals.set(bid, (batTotals.get(bid) ?? 0) + 1);
    }
  }
  for (const [id, c] of batTotals) {
    if (c > (state.owned.batteries[id] ?? 0)) return false;
  }

  const hypoState: MinecoreState = { ...state, plantSlots: hypotheticalSlots };
  const deckUses = new Map<number, number>();
  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    const idx = p.setup.workerNftDeckSlotIndex;
    if (idx == null) continue;
    deckUses.set(idx, (deckUses.get(idx) ?? 0) + 1);
  }
  for (const [deckIdx, c] of deckUses) {
    if (c > 1) {
      return false;
    }
    const deck = state.nftSlots?.[deckIdx];
    if (!deck || deck.type !== 'worker' || deck.nftId == null || !deck.collection) return false;
    const holder = hypotheticalSlots.find((x) => x.unlocked && x.setup.workerNftDeckSlotIndex === deckIdx);
    if (!holder || !plantWorkerNftDeckAssignmentValid(hypoState, holder)) return false;
  }

  const modTotals = new Map<MinecoreModuleId, number>();
  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    for (const mid of p.setup.moduleIds) {
      modTotals.set(mid, (modTotals.get(mid) ?? 0) + 1);
    }
  }
  for (const [id, c] of modTotals) {
    if (c > (state.owned.modules[id] ?? 0)) return false;
  }

  return true;
}

/**
 * If `inventoryAllowsPlantSetup` would reject `nextSetup`, returns a short player-facing reason; otherwise null.
 * Mirrors inventoryAllowsPlantSetup ordering so messaging stays aligned with the guard.
 */
export function explainPlantSetupBlock(state: MinecoreState, slotIndex: number, nextSetup: PlantSetup): string | null {
  if (inventoryAllowsPlantSetup(state, slotIndex, nextSetup)) return null;

  const target = state.plantSlots[slotIndex];
  if (!target) return 'Plant slot unavailable.';
  const normalizedNext = normalizePlantSetup(target.type, nextSetup);
  const hypotheticalSlots = state.plantSlots.map((p, i) => ({
    ...p,
    setup: normalizePlantSetup(p.type, i === slotIndex ? normalizedNext : p.setup),
  }));

  const machineIds = new Set<MinecoreMachineId>();
  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    if (p.setup.machineId) machineIds.add(p.setup.machineId);
  }
  for (const id of machineIds) {
    const assigned = hypotheticalSlots.reduce(
      (n, p) => n + (p.unlocked && p.setup.machineId === id ? 1 : 0),
      0,
    );
    const owned = state.owned.machines[id] ?? 0;
    if (assigned > owned) {
      return `Not enough rig inventory (${assigned} needed vs ${owned} owned for this type). Assign elsewhere or craft another.`;
    }
  }

  const batTotals = new Map<MinecoreBatteryId, number>();
  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    const n = getPlantBatterySlotCount(p.type);
    for (let bi = 0; bi < n; bi++) {
      const bid = p.setup.batteryIds[bi] ?? null;
      if (bid) batTotals.set(bid, (batTotals.get(bid) ?? 0) + 1);
    }
  }
  for (const [id, c] of batTotals) {
    const owned = state.owned.batteries[id] ?? 0;
    if (c > owned) {
      return `Not enough battery packs (${c} slots filled vs ${owned} owned for this type).`;
    }
  }

  const hypoState: MinecoreState = { ...state, plantSlots: hypotheticalSlots };
  const deckUses = new Map<number, number>();
  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    const widx = p.setup.workerNftDeckSlotIndex;
    if (widx == null) continue;
    deckUses.set(widx, (deckUses.get(widx) ?? 0) + 1);
  }
  for (const [deckIdx, c] of deckUses) {
    if (c > 1) {
      return 'That Worker NFT deck slot is already assigned to another plant.';
    }
    const deck = state.nftSlots?.[deckIdx];
    if (!deck || deck.type !== 'worker' || deck.nftId == null || !deck.collection) {
      return 'Deploy a Worker NFT in Workers tab for that deck slot, then assign it here.';
    }
    const holder = hypotheticalSlots.find((x) => x.unlocked && x.setup.workerNftDeckSlotIndex === deckIdx);
    if (!holder || !plantWorkerNftDeckAssignmentValid(hypoState, holder)) {
      return 'Worker crew assignment is invalid — pick a Worker deck slot with an NFT deployed.';
    }
  }

  const modTotals = new Map<MinecoreModuleId, number>();
  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    for (const mid of p.setup.moduleIds) {
      modTotals.set(mid, (modTotals.get(mid) ?? 0) + 1);
    }
  }
  for (const [id, c] of modTotals) {
    const owned = state.owned.modules[id] ?? 0;
    if (c > owned) {
      return `Not enough modules (${c} slots vs ${owned} owned for this type).`;
    }
  }

  return 'Cannot assign — inventory limits.';
}

/** UI display: assigned units cannot exceed inventory (guards stale save / edge cases). */
export function displayAssignedCount(assigned: number, owned: number): number {
  const o = Math.max(0, owned);
  return Math.min(Math.max(0, assigned), o);
}

export function countMachinesAssigned(slots: PlantSlotState[], id: MinecoreMachineId): number {
  return slots.reduce((n, s) => n + (s.unlocked && s.setup.machineId === id ? 1 : 0), 0);
}

export function countBatteriesAssigned(slots: PlantSlotState[], id: MinecoreBatteryId): number {
  return slots.reduce((n, s) => {
    if (!s.unlocked) return n;
    const nSlots = getPlantBatterySlotCount(s.type);
    let c = 0;
    for (let i = 0; i < nSlots; i++) {
      if ((s.setup.batteryIds?.[i] ?? null) === id) c += 1;
    }
    return n + c;
  }, 0);
}

/** Count installed copies of this module across all unlocked plants. */
export function countModuleAssignments(slots: PlantSlotState[], id: MinecoreModuleId): number {
  return slots.reduce((n, s) => {
    if (!s.unlocked) return n;
    return n + s.setup.moduleIds.filter((mid) => mid === id).length;
  }, 0);
}

/** Workers-tab NFT decks: counts filled vs slots for each role (`worker`, `operator`, `foreman`, `engineer`, …). */
export function nftTabSlotDeployments(slots: MiningSlot[], role: MiningSlotType): { filled: number; capacity: number } {
  const matching = slots.filter((s) => s.type === role);
  const capacity = Math.max(1, matching.length);
  const filled = matching.filter((s) => s.nftId != null).length;
  return { filled, capacity };
}

/** NFT crew roles shown on Workers tab + mining UI (stable order). */
export const MINECORE_NFT_CREW_ROLES_ORDER: MiningSlotType[] = ['worker', 'operator', 'foreman', 'engineer', 'booster'];

export function nftCrewRoleLabel(role: MiningSlotType): string {
  switch (role) {
    case 'worker':
      return 'Worker';
    case 'operator':
      return 'Operator';
    case 'foreman':
      return 'Foreman';
    case 'engineer':
      return 'Engineer';
    case 'booster':
      return 'Booster';
    default:
      return role;
  }
}
