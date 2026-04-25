import {
  MINECORE_BATTERIES,
  MINECORE_BOOSTS,
  MINECORE_MACHINES,
  MINECORE_MODULES,
  MINECORE_WORKERS,
} from './config';
import type { MinecoreState, PlantSlotState } from './types';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Power consumption factor for the machine installed in this slot (1.0 = baseline). */
export function getPlantPowerFactor(slot: PlantSlotState): number {
  return slot.setup.machineId
    ? (MINECORE_MACHINES[slot.setup.machineId]?.powerConsumptionFactor ?? 1)
    : 1;
}

/** Full charge capacity for the battery installed in this slot, in ms. */
export function getBatteryCapacityMs(slot: PlantSlotState): number {
  return slot.setup.batteryId
    ? (MINECORE_BATTERIES[slot.setup.batteryId]?.chargeCapacityMs ?? 0)
    : 0;
}

// ── Core computations ────────────────────────────────────────────────────────

export function computePlantReady(slot: PlantSlotState): boolean {
  if (!slot.unlocked) return false;
  if (!slot.setup.machineId) return false;
  if (!slot.setup.batteryId) return false;
  if (!slot.setup.workerId) return false;
  return true;
}

export function computePlantExpectedDiamonds(state: MinecoreState, slot: PlantSlotState): number {
  const machine = slot.setup.machineId ? MINECORE_MACHINES[slot.setup.machineId] : null;
  const worker  = slot.setup.workerId  ? MINECORE_WORKERS[slot.setup.workerId]   : null;
  const battery = slot.setup.batteryId ? MINECORE_BATTERIES[slot.setup.batteryId] : null;
  const boost   = MINECORE_BOOSTS[slot.setup.boostId];

  if (!machine || !worker || !battery) return 0;

  const moduleBonus     = slot.setup.moduleIds.reduce((acc, id) => acc + (MINECORE_MODULES[id]?.outputBonus ?? 0), 0);
  const finalDiamonds   = machine.baseOutput * worker.multiplier * boost.multiplier * battery.efficiency * (1 + moduleBonus);
  return Math.max(0, Math.floor(finalDiamonds));
}

export function computePlantDurationMs(slot: PlantSlotState): number {
  if (!slot.setup.machineId) return 0;
  return MINECORE_MACHINES[slot.setup.machineId]?.durationMs ?? 0;
}

/**
 * Live battery charge remaining (ms of base charge).
 * Drains at `powerConsumptionFactor` per real ms while a cycle is active.
 */
export function computeLiveBatteryChargeMs(slot: PlantSlotState, now: number): number {
  if (!slot.cycle || slot.cycle.endAtMs <= slot.cycle.startAtMs) {
    return slot.batteryChargeMs;
  }
  // Only drain if cycle is actually running (not yet ended)
  const elapsed      = Math.max(0, now - slot.batterySnapshotAt);
  const powerFactor  = getPlantPowerFactor(slot);
  return Math.max(0, slot.batteryChargeMs - elapsed * powerFactor);
}

/**
 * How long (in real ms) the battery will continue to run at the current machine's draw rate.
 * E.g. 30 min charge / 2.0 power factor = 15 min real runtime.
 */
export function computeBatteryRuntimeMs(slot: PlantSlotState, now: number): number {
  const charge      = computeLiveBatteryChargeMs(slot, now);
  const powerFactor = getPlantPowerFactor(slot);
  return powerFactor > 0 ? charge / powerFactor : 0;
}

/**
 * Diamonds accumulated so far in the current cycle.
 * Proportional to min(elapsed, battery runtime, cycle duration) / cycle duration.
 */
export function computeLiveDiamonds(slot: PlantSlotState, now: number): number {
  if (!slot.cycle) return 0;
  const elapsed          = Math.max(0, now - slot.cycle.startAtMs);
  const batteryRuntimeMs = computeBatteryRuntimeMs(slot, now);
  const effectiveElapsed = Math.min(elapsed, batteryRuntimeMs, slot.cycle.durationMs);
  if (slot.cycle.durationMs <= 0) return 0;
  return Math.floor((effectiveElapsed / slot.cycle.durationMs) * slot.cycle.expectedDiamonds);
}

/**
 * D/min production rate (live, based on machine + current setup).
 * Returns 0 when battery is depleted or no cycle is active.
 */
export function computeFlowRatePerMin(slot: PlantSlotState, now: number): number {
  if (!slot.cycle) return 0;
  const liveCharge = computeLiveBatteryChargeMs(slot, now);
  if (liveCharge <= 0) return 0;
  const perMs = slot.cycle.expectedDiamonds / Math.max(1, slot.cycle.durationMs);
  return perMs * 60_000;
}

// ── Status derivation ────────────────────────────────────────────────────────

export function deriveSlotStatus(
  state: MinecoreState,
  slot: PlantSlotState,
  now: number,
): PlantSlotState['status'] {
  if (!slot.unlocked) return 'EmptySlot';
  if (slot.needsRepair) return 'NeedsRepair';
  if (!computePlantReady(slot)) return 'SetupIncomplete';
  if (slot.cycle) {
    // Battery-empty check (mid-cycle depletion)
    const liveCharge = computeLiveBatteryChargeMs(slot, now);
    if (liveCharge <= 0 && now < slot.cycle.endAtMs) return 'BatteryEmpty';
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

/** Wallet balance plus diamonds locked in active cycles. */
export function computeMinecoreDiamondsDisplayTotal(state: MinecoreState, now: number): number {
  const inPlants = state.plantSlots.reduce(
    (acc, p) => (p.cycle ? acc + computeLiveDiamonds(p, now) : acc),
    0,
  );
  return state.diamondsBalance + inPlants;
}
