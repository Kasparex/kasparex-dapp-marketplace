import type {
  MinecoreBatteryId,
  MinecoreBoostId,
  MinecoreMachineId,
  MinecoreModuleId,
  MinecorePowerNodeId,
  MinecoreState,
  PlantSetup,
  PlantSlotState,
} from './types';
import type { MiningSlot, MiningSlotType } from '@/lib/game/engine';
import {
  fabricatedOperatorSlotsCapacity,
  MINECORE_MAX_MODULES_BY_PLANT,
  MINECORE_PLANT_PRESETS,
  MINECORE_POWER_NODES,
  miningWorkerNftSlotsRequired,
} from './config';
import { getPlantBatterySlotCount, getPlantPowerNodeSlotCount, normalizePowerNodeIds } from './battery-utils';

export function normalizeWorkerDeckIndices(
  plantType: PlantSlotState['type'],
  setup: PlantSetup & { workerNftDeckSlotIndex?: number | null },
): (number | null)[] {
  const need = miningWorkerNftSlotsRequired(plantType);
  const fromLegacy =
    typeof setup.workerNftDeckSlotIndex === 'number' && Number.isFinite(setup.workerNftDeckSlotIndex)
      ? [Math.max(0, Math.floor(setup.workerNftDeckSlotIndex))]
      : setup.workerNftDeckSlotIndex === null && !Array.isArray(setup.workerNftDeckSlotIndices)
        ? [null]
        : null;
  const raw = Array.isArray(setup.workerNftDeckSlotIndices)
    ? [...setup.workerNftDeckSlotIndices]
    : fromLegacy ?? [];
  return Array.from({ length: need }, (_, i) => {
    if (i >= raw.length) return null;
    const v = raw[i];
    if (v == null || !Number.isFinite(v)) return null;
    return Math.max(0, Math.floor(v as number));
  });
}

/** Pad battery slots + worker deck indices + stable boost id so inventory math matches plant tier (fixes short/partial saves). */
export function normalizePlantSetup(type: PlantSlotState['type'], setup: PlantSetup): PlantSetup {
  const n = getPlantBatterySlotCount(type);
  const batteryIds = Array.from({ length: n }, (_, i) =>
    i < (setup.batteryIds?.length ?? 0) ? ((setup.batteryIds![i] ?? null) as MinecoreBatteryId | null) : null,
  );
  const workerNftDeckSlotIndices = normalizeWorkerDeckIndices(type, setup as PlantSetup & { workerNftDeckSlotIndex?: number | null });
  const powerNodeIds = normalizePowerNodeIds(setup, type);
  return {
    machineId: setup.machineId,
    workerNftDeckSlotIndices,
    moduleIds: [...setup.moduleIds],
    batteryIds,
    boostId: setup.boostId ?? 'none',
    powerNodeIds,
  };
}

/** Mirrors `InstallPart` `part` payload for hypothetical setup checks. */
export type InstallPartPayload =
  | { kind: 'machine'; id: MinecoreMachineId | null }
  | { kind: 'battery'; id: MinecoreBatteryId | null; batterySlotIndex?: number }
  | { kind: 'crewWorkerNftDeck'; deckSlotIndex: number | null; workerSlotPosition?: number }
  | { kind: 'crewWorkerNftDecks'; indices: (number | null)[] }
  | { kind: 'powerNodes'; ids: (MinecorePowerNodeId | null)[] }
  | { kind: 'modules'; ids: MinecoreModuleId[] }
  | { kind: 'boost'; id: MinecoreBoostId };

const MINING_PLANT_NFT_DECK_TYPES: ReadonlySet<MiningSlotType> = new Set(['worker', 'operator', 'foreman']);

function miningDeckAtIndexValid(state: MinecoreState, idx: number): boolean {
  const deck = state.nftSlots?.[idx];
  return Boolean(
    deck && deck.nftId != null && deck.collection && MINING_PLANT_NFT_DECK_TYPES.has(deck.type),
  );
}

/** Every required worker-slot position has a distinct, valid NFT deck binding. */
export function plantNftSlotAssignmentValid(state: MinecoreState, slot: PlantSlotState): boolean {
  const plantCrewSlots = miningWorkerNftSlotsRequired(slot.type);
  const machineNeed = fabricatedOperatorSlotsCapacity(slot.setup.machineId);
  if (machineNeed > plantCrewSlots) return false;

  const idxs = normalizePlantSetup(slot.type, slot.setup).workerNftDeckSlotIndices;
  const used = new Set<number>();
  for (let i = 0; i < plantCrewSlots; i++) {
    const idx = idxs[i];
    if (idx == null || idx < 0) return false;
    if (used.has(idx)) return false;
    used.add(idx);
    if (!miningDeckAtIndexValid(state, idx)) return false;
  }
  return true;
}

/**
 * Validates only non-null crew links: duplicates or broken Workers-tab refs fail.
 * Unfilled crew positions (null) are allowed so assigning one plant is not blocked
 * because other plants are not staffed yet (`plantNftSlotAssignmentValid` stays strict).
 */
export function plantWorkerCrewReferencesConsistent(state: MinecoreState, slot: PlantSlotState): boolean {
  const need = miningWorkerNftSlotsRequired(slot.type);
  const idxs = normalizePlantSetup(slot.type, slot.setup).workerNftDeckSlotIndices;
  const used = new Set<number>();
  for (let i = 0; i < need; i++) {
    const raw = idxs[i];
    if (raw == null || raw < 0 || !Number.isFinite(raw)) continue;
    const idx = Math.max(0, Math.floor(Number(raw)));
    if (used.has(idx)) return false;
    used.add(idx);
    if (!miningDeckAtIndexValid(state, idx)) return false;
  }
  return true;
}

/** @deprecated Use `plantNftSlotAssignmentValid` */
export const plantWorkerNftDeckAssignmentValid = plantNftSlotAssignmentValid;

export function countWorkerNftDeckAssignmentsExcept(
  slots: PlantSlotState[],
  deckSlotIndex: number,
  exceptPlantSlotIndex: number,
): number {
  return slots.reduce(
    (n, p, i) =>
      n +
      (p.unlocked &&
      i !== exceptPlantSlotIndex &&
      (normalizePlantSetup(p.type, p.setup).workerNftDeckSlotIndices ?? []).includes(deckSlotIndex)
        ? 1
        : 0),
    0,
  );
}

/** Uses plantSlots array index (matches InstallPart slotIndex), not slot.index - avoids drift from persisted metadata. */
export function countMachinesAssignedExcept(slots: PlantSlotState[], id: MinecoreMachineId, exceptSlotIndex: number): number {
  return slots.reduce(
    (n, p, i) => n + (p.unlocked && i !== exceptSlotIndex && p.setup.machineId === id ? 1 : 0),
    0,
  );
}

export function countPowerNodesAssigned(slots: PlantSlotState[], id: MinecorePowerNodeId): number {
  return slots.reduce((n, p) => {
    if (!p.unlocked) return n;
    const ids = normalizePlantSetup(p.type, p.setup).powerNodeIds;
    return n + ids.filter((x) => x === id).length;
  }, 0);
}

export function countPowerNodesAssignedExcept(slots: PlantSlotState[], id: MinecorePowerNodeId, exceptSlotIndex: number): number {
  return slots.reduce((n, p, i) => {
    if (!p.unlocked || i === exceptSlotIndex) return n;
    const ids = normalizePlantSetup(p.type, p.setup).powerNodeIds;
    return n + ids.filter((x) => x === id).length;
  }, 0);
}

/** Next setup after applying `InstallPart`-style payload (no battery rescaling). */
export function nextPlantSetupAfterInstallPart(slot: PlantSlotState, part: InstallPartPayload): PlantSetup {
  const base = normalizePlantSetup(slot.type, slot.setup);
  const setup: PlantSetup = {
    ...base,
    batteryIds: [...base.batteryIds],
    moduleIds: [...base.moduleIds],
    workerNftDeckSlotIndices: [...base.workerNftDeckSlotIndices],
    powerNodeIds: [...base.powerNodeIds],
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
    const need = miningWorkerNftSlotsRequired(slot.type);
    const pos =
      part.workerSlotPosition != null ? Math.max(0, Math.min(need - 1, Math.floor(part.workerSlotPosition))) : 0;
    const next = normalizeWorkerDeckIndices(slot.type, setup);
    const copy = [...next];
    copy[pos] = part.deckSlotIndex == null ? null : Math.max(0, Math.floor(part.deckSlotIndex));
    setup.workerNftDeckSlotIndices = copy;
    return setup;
  }
  if (part.kind === 'crewWorkerNftDecks') {
    const need = miningWorkerNftSlotsRequired(slot.type);
    const incoming = part.indices ?? [];
    setup.workerNftDeckSlotIndices = Array.from({ length: need }, (_, i) => {
      const v = incoming[i];
      if (v == null || !Number.isFinite(v)) return null;
      return Math.max(0, Math.floor(Number(v)));
    });
    return setup;
  }
  if (part.kind === 'powerNodes') {
    const n = getPlantPowerNodeSlotCount(slot.type);
    const incoming = part.ids ?? [];
    setup.powerNodeIds = Array.from({ length: n }, (_, i) => {
      const v = incoming[i];
      return v != null && MINECORE_POWER_NODES[v] ? v : null;
    });
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
  const plantCrewSlots = miningWorkerNftSlotsRequired(target.type);
  if (fabricatedOperatorSlotsCapacity(normalizedNext.machineId) > plantCrewSlots) return false;
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

  const reactorTotals = new Map<MinecorePowerNodeId, number>();
  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    for (const nid of normalizePlantSetup(p.type, p.setup).powerNodeIds) {
      if (nid) reactorTotals.set(nid, (reactorTotals.get(nid) ?? 0) + 1);
    }
  }
  for (const [id, c] of reactorTotals) {
    if (c > (state.owned.nodes[id] ?? 0)) return false;
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

  const deckUses = new Map<number, number>();
  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    for (const widx of normalizePlantSetup(p.type, p.setup).workerNftDeckSlotIndices) {
      if (widx == null) continue;
      deckUses.set(widx, (deckUses.get(widx) ?? 0) + 1);
    }
  }
  for (const [deckIdx, c] of deckUses) {
    if (c > 1) {
      return false;
    }
    const deck = state.nftSlots?.[deckIdx];
    if (!deck || !MINING_PLANT_NFT_DECK_TYPES.has(deck.type) || deck.nftId == null || !deck.collection) return false;
  }

  const hypoState: MinecoreState = { ...state, plantSlots: hypotheticalSlots };
  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    if (!plantWorkerCrewReferencesConsistent(hypoState, p)) return false;
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
  const plantCrew = miningWorkerNftSlotsRequired(target.type);
  const machineNeed = fabricatedOperatorSlotsCapacity(normalizedNext.machineId);
  if (machineNeed > plantCrew) {
    const preset = MINECORE_PLANT_PRESETS[target.type];
    return `This rig needs ${machineNeed} staffed crew links; ${preset?.label ?? 'this plant tier'} supports ${plantCrew}. Upgrade the plant or pick a smaller rig.`;
  }
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

  const reactorTotalsExplain = new Map<MinecorePowerNodeId, number>();
  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    for (const nid of normalizePlantSetup(p.type, p.setup).powerNodeIds) {
      if (nid) reactorTotalsExplain.set(nid, (reactorTotalsExplain.get(nid) ?? 0) + 1);
    }
  }
  for (const [id, assigned] of reactorTotalsExplain) {
    const owned = state.owned.nodes[id] ?? 0;
    if (assigned > owned) {
      return `Not enough reactors (${assigned} on plants vs ${owned} owned for this type). Craft in Build or unlink elsewhere.`;
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
    for (const widx of normalizePlantSetup(p.type, p.setup).workerNftDeckSlotIndices) {
      if (widx == null) continue;
      deckUses.set(widx, (deckUses.get(widx) ?? 0) + 1);
    }
  }
  for (const [deckIdx, c] of deckUses) {
    if (c > 1) {
      return 'That Workers-tab NFT is already linked to another plant.';
    }
    const deck = state.nftSlots?.[deckIdx];
    if (!deck || !MINING_PLANT_NFT_DECK_TYPES.has(deck.type) || deck.nftId == null || !deck.collection) {
      return 'Put a Worker, Operator, or Foreman NFT in that Workers-tab row first, then link it here.';
    }
  }

  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    if (plantWorkerCrewReferencesConsistent(hypoState, p)) continue;
    const need = miningWorkerNftSlotsRequired(p.type);
    const idxs = normalizePlantSetup(p.type, p.setup).workerNftDeckSlotIndices;
    const usedLocal = new Set<number>();
    for (let i = 0; i < need; i++) {
      const raw = idxs[i];
      if (raw == null || raw < 0 || !Number.isFinite(raw)) continue;
      const n = Math.max(0, Math.floor(Number(raw)));
      if (usedLocal.has(n)) {
        return 'This plant links two crew slots to the same Workers-tab row. Use two different NFT rows.';
      }
      usedLocal.add(n);
      if (!miningDeckAtIndexValid(hypoState, n)) {
        return 'Put a Worker, Operator, or Foreman NFT in that Workers-tab row first, then link it here.';
      }
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

  return 'Cannot assign: inventory limits.';
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

/** Workers-tab NFT decks: counts filled vs slots for each role (`worker`, `operator`, `foreman`). */
export function nftTabSlotDeployments(slots: MiningSlot[], role: MiningSlotType): { filled: number; capacity: number } {
  const matching = slots.filter((s) => s.type === role);
  const capacity = Math.max(1, matching.length);
  const filled = matching.filter((s) => s.nftId != null).length;
  return { filled, capacity };
}

/** NFT deck roles shown on Workers tab + mining UI (stable order). */
export const MINECORE_NFT_CREW_ROLES_ORDER: MiningSlotType[] = ['worker', 'operator', 'foreman'];

export function nftDeckRoleLabel(role: MiningSlotType): string {
  switch (role) {
    case 'worker':
      return 'Worker';
    case 'operator':
      return 'Operator';
    case 'foreman':
      return 'Foreman';
    default:
      return role;
  }
}

/** @deprecated Use `nftDeckRoleLabel` */
export const nftCrewRoleLabel = nftDeckRoleLabel;
