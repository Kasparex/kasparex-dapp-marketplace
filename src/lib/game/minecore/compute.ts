import {
  MINECORE_BATTERIES,
  MINECORE_BOOSTS,
  MINECORE_MACHINES,
  MINECORE_MODULES,
  MINECORE_WORKERS,
} from './config';
import type { MinecoreState, PlantSlotState } from './types';

export function computePlantReady(slot: PlantSlotState): boolean {
  if (!slot.unlocked) return false;
  if (!slot.setup.machineId) return false;
  if (!slot.setup.batteryId) return false;
  if (!slot.setup.workerId) return false;
  return true;
}

export function computePlantExpectedDiamonds(state: MinecoreState, slot: PlantSlotState): number {
  const machine = slot.setup.machineId ? MINECORE_MACHINES[slot.setup.machineId] : null;
  const worker = slot.setup.workerId ? MINECORE_WORKERS[slot.setup.workerId] : null;
  const battery = slot.setup.batteryId ? MINECORE_BATTERIES[slot.setup.batteryId] : null;
  const boost = MINECORE_BOOSTS[slot.setup.boostId];

  if (!machine || !worker || !battery) return 0;

  const moduleBonus = slot.setup.moduleIds.reduce((acc, id) => acc + (MINECORE_MODULES[id]?.outputBonus ?? 0), 0);

  const baseDiamonds = machine.baseOutput;
  const workerMultiplier = worker.multiplier;
  const boostMultiplier = boost.multiplier;
  const batteryEfficiency = battery.efficiency;

  const finalDiamonds = baseDiamonds * workerMultiplier * boostMultiplier * batteryEfficiency * (1 + moduleBonus);
  return Math.max(0, Math.floor(finalDiamonds));
}

export function computePlantDurationMs(slot: PlantSlotState): number {
  if (!slot.setup.machineId) return 0;
  return MINECORE_MACHINES[slot.setup.machineId]?.durationMs ?? 0;
}

export function deriveSlotStatus(state: MinecoreState, slot: PlantSlotState, now: number): PlantSlotState['status'] {
  if (!slot.unlocked) return 'EmptySlot';
  if (slot.needsRepair) return 'NeedsRepair';
  if (!computePlantReady(slot)) return 'SetupIncomplete';
  if (slot.cycle) {
    if (now >= slot.cycle.endAtMs) return 'ExtractionReady';
    return 'MiningActive';
  }
  if (slot.powerRemaining <= 0) return 'NeedsPower';
  return 'ReadyToMine';
}

export function deriveState(state: MinecoreState, now: number): MinecoreState {
  const nextSlots = state.plantSlots.map((s) => ({ ...s, status: deriveSlotStatus(state, s, now) }));
  return { ...state, plantSlots: nextSlots };
}

/** Wallet balance plus diamonds committed in active or completed-but-unextracted cycles (mirrors “total on-site” in DV mining hero). */
export function computeMinecoreDiamondsDisplayTotal(state: MinecoreState): number {
  const inPlants = state.plantSlots.reduce((acc, p) => (p.cycle ? acc + p.cycle.expectedDiamonds : acc), 0);
  return state.diamondsBalance + inPlants;
}

