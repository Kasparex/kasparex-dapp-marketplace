import type {
  MinecoreBatteryId,
  MinecoreMachineId,
  MinecoreModuleId,
  MinecoreWorkerId,
  PlantSlotState,
} from './types';

export function countMachinesAssigned(slots: PlantSlotState[], id: MinecoreMachineId): number {
  return slots.reduce((n, s) => n + (s.unlocked && s.setup.machineId === id ? 1 : 0), 0);
}

export function countBatteriesAssigned(slots: PlantSlotState[], id: MinecoreBatteryId): number {
  return slots.reduce((n, s) => n + (s.unlocked && s.setup.batteryId === id ? 1 : 0), 0);
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
