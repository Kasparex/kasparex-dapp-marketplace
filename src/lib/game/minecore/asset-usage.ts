import type {
  MinecoreBatteryId,
  MinecoreBoostId,
  MinecoreMachineId,
  MinecoreModuleId,
  MinecoreState,
  MinecoreWorkerId,
  PlantSetup,
  PlantSlotState,
} from './types';
import type { MiningSlot, MiningSlotType } from '@/lib/game/engine';
import { MINECORE_MAX_MODULES_BY_PLANT } from './config';
import { getPlantBatterySlotCount } from './battery-utils';

/** Mirrors `InstallPart` `part` payload for hypothetical setup checks. */
export type InstallPartPayload =
  | { kind: 'machine'; id: MinecoreMachineId | null }
  | { kind: 'battery'; id: MinecoreBatteryId | null; batterySlotIndex?: number }
  | { kind: 'worker'; id: MinecoreWorkerId | null }
  | { kind: 'modules'; ids: MinecoreModuleId[] }
  | { kind: 'boost'; id: MinecoreBoostId };

export function countMachinesAssignedExcept(slots: PlantSlotState[], id: MinecoreMachineId, exceptSlotIndex: number): number {
  return slots.reduce((n, p) => n + (p.unlocked && p.index !== exceptSlotIndex && p.setup.machineId === id ? 1 : 0), 0);
}

export function countWorkersAssignedExcept(slots: PlantSlotState[], id: MinecoreWorkerId, exceptSlotIndex: number): number {
  return slots.reduce((n, p) => n + (p.unlocked && p.index !== exceptSlotIndex && p.setup.workerId === id ? 1 : 0), 0);
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
  if (part.kind === 'worker') {
    setup.workerId = part.id;
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
  const hypotheticalSlots = state.plantSlots.map((p, i) => (i === slotIndex ? { ...p, setup: nextSetup } : p));

  const machineIds = new Set<MinecoreMachineId>();
  const workerIds = new Set<MinecoreWorkerId>();
  for (const p of hypotheticalSlots) {
    if (!p.unlocked) continue;
    if (p.setup.machineId) machineIds.add(p.setup.machineId);
    if (p.setup.workerId) workerIds.add(p.setup.workerId);
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
    for (const bid of p.setup.batteryIds ?? []) {
      if (bid) batTotals.set(bid, (batTotals.get(bid) ?? 0) + 1);
    }
  }
  for (const [id, c] of batTotals) {
    if (c > (state.owned.batteries[id] ?? 0)) return false;
  }

  for (const id of workerIds) {
    const assigned = hypotheticalSlots.reduce(
      (n, p) => n + (p.unlocked && p.setup.workerId === id ? 1 : 0),
      0,
    );
    if (assigned > (state.owned.workers[id] ?? 0)) return false;
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
    const ids = s.setup.batteryIds ?? [];
    return n + ids.filter((x) => x === id).length;
  }, 0);
}

export function countWorkersAssigned(slots: PlantSlotState[], id: MinecoreWorkerId): number {
  return slots.reduce((n, s) => n + (s.unlocked && s.setup.workerId === id ? 1 : 0), 0);
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
