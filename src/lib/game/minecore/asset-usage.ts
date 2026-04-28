import type {
  MinecoreBatteryId,
  MinecoreMachineId,
  MinecoreModuleId,
  MinecoreWorkerId,
  PlantSlotState,
} from './types';
import type { MiningSlot, MiningSlotType } from '@/lib/game/engine';

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
