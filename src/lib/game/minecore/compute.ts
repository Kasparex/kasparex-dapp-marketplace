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

/** Machine draw only — the rig sets consumption; there is no separate power-plant layer. */
export function getPowerDrainScale(slot: PlantSlotState): number {
  return getPlantPowerFactor(slot);
}

/**
 * Max reserve power units: machine `powerGridContribution` + battery `powerCapacity` (each mining start spends 1).
 */
export function getPowerUnitCap(slot: PlantSlotState): number {
  const m = slot.setup.machineId ? (MINECORE_MACHINES[slot.setup.machineId]?.powerGridContribution ?? 0) : 0;
  const b = slot.setup.batteryId ? (MINECORE_BATTERIES[slot.setup.batteryId]?.powerCapacity ?? 0) : 0;
  const sum = m + b;
  if (sum <= 0) return 0;
  return Math.max(1, sum);
}

export function isCyclePaused(slot: PlantSlotState, _now: number): boolean {
  return Boolean(slot.cycle?.pauseBeganAtMs != null);
}

/** Clock used for production math while paused. */
export function productionClockMs(slot: PlantSlotState, now: number): number {
  if (slot.cycle?.pauseBeganAtMs != null) return slot.cycle.pauseBeganAtMs;
  return now;
}

/** Full charge capacity for the battery in this slot (× machine `powerBudgetMultiplier` when a rig is installed). */
export function getBatteryCapacityMs(slot: PlantSlotState): number {
  const base = slot.setup.batteryId
    ? (MINECORE_BATTERIES[slot.setup.batteryId]?.chargeCapacityMs ?? 0)
    : 0;
  if (base <= 0) return 0;
  const mult = slot.setup.machineId ? (MINECORE_MACHINES[slot.setup.machineId]?.powerBudgetMultiplier ?? 1) : 1;
  return Math.max(0, Math.floor(base * mult));
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
  if (slot.cycle.pauseBeganAtMs != null) {
    return slot.batteryChargeMs;
  }
  const drainUntil   = Math.min(now, slot.cycle.endAtMs);
  const elapsed      = Math.max(0, drainUntil - slot.batterySnapshotAt);
  const powerFactor  = getPowerDrainScale(slot);
  return Math.max(0, slot.batteryChargeMs - elapsed * powerFactor);
}

/**
 * How long (in real ms) the battery will continue to run at the current machine's draw rate.
 * E.g. 30 min charge / 2.0 power factor = 15 min real runtime.
 */
export function computeBatteryRuntimeMs(slot: PlantSlotState, now: number): number {
  const charge      = computeLiveBatteryChargeMs(slot, now);
  const powerFactor = getPowerDrainScale(slot);
  return powerFactor > 0 ? charge / powerFactor : 0;
}

/**
 * Raw diamonds accumulated in the current cycle before siphon (`mintedOffset`).
 */
export function computeRawLiveDiamonds(slot: PlantSlotState, now: number): number {
  if (!slot.cycle) return 0;
  const clock    = productionClockMs(slot, now);
  const elapsed  = Math.max(0, clock - slot.cycle.startAtMs);
  const batteryRuntimeMs = computeBatteryRuntimeMs(slot, now);
  const effectiveElapsed = Math.min(elapsed, batteryRuntimeMs, slot.cycle.durationMs);
  if (slot.cycle.durationMs <= 0) return 0;
  return Math.floor((effectiveElapsed / slot.cycle.durationMs) * slot.cycle.expectedDiamonds);
}

/**
 * Diamonds remaining in the current cycle (after Refine siphon via `mintedOffset`).
 */
export function computeLiveDiamonds(slot: PlantSlotState, now: number): number {
  if (!slot.cycle) return 0;
  const raw = computeRawLiveDiamonds(slot, now);
  const off = slot.cycle.mintedOffset ?? 0;
  return Math.max(0, raw - off);
}

/**
 * D/min production rate (live, based on machine + current setup).
 * Returns 0 when battery is depleted or no cycle is active.
 */
export function computeFlowRatePerMin(slot: PlantSlotState, now: number): number {
  if (!slot.cycle) return 0;
  if (isCyclePaused(slot, now)) return 0;
  const liveCharge = computeLiveBatteryChargeMs(slot, now);
  if (liveCharge <= 0) return 0;
  const perMs = slot.cycle.expectedDiamonds / Math.max(1, slot.cycle.durationMs);
  return perMs * 60_000;
}

/** UI: cycle bar progress (frozen while paused) and time remaining in the cycle window. */
export function computeCycleProgress(slot: PlantSlotState, now: number): { progress: number; remainingMs: number } {
  const c = slot.cycle;
  if (!c) return { progress: 0, remainingMs: 0 };
  const start = c.startAtMs;
  const end = c.endAtMs;
  const denom = Math.max(1, end - start);
  const t = c.pauseBeganAtMs != null ? c.pauseBeganAtMs : now;
  const progress = Math.max(0, Math.min(1, (t - start) / denom));
  const remainingMs = c.pauseBeganAtMs != null ? Math.max(0, end - c.pauseBeganAtMs) : Math.max(0, end - now);
  return { progress, remainingMs };
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
    if (slot.cycle.pauseBeganAtMs != null) return 'MiningPaused';
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
    (acc, p) => acc + p.diamondsAccumulated + (p.cycle ? computeLiveDiamonds(p, now) : 0),
    0,
  );
  return state.diamondsBalance + inPlants;
}
