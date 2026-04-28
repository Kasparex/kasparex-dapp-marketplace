/**
 * Live mining progress is derived from persisted `PlantSlotState` timestamps (`cycle`, `batterySnapshotAt`)
 * and wall-clock `now`, so reconnecting applies the same deterministic math offline (tab may be closed).
 */
import { MINECORE_DAY_MS, MINECORE_MACHINES, MINECORE_MODULES, MINECORE_PLANT_BASE_POWER_UNITS } from './config';
import {
  drainWaterfallRemaining,
  getMaxChargePerSlotMs,
  hasInstalledBattery,
  sumChargeMs,
} from './battery-utils';
import type { MinecoreState, PlantSlotState } from './types';
import {
  plantWorkerNftDeckAssignmentValid,
} from './asset-usage';
import {
  canStartMiningByEfficiency,
  computeExpectedDiamondsForCycle,
  computeEffectiveCycleDurationMs,
  computePlantRollingDailyCapCeiling,
} from './plant-economy';
import { rollPlantRollingDailyCapIfNeeded } from './daily-cap';

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
 * Max reserve power units: plant tier only (V1). Batteries and rigs do not add to this cap.
 * Each mining start typically spends 1 unit while units remain.
 */
export function getPowerUnitCap(slot: PlantSlotState): number {
  if (!slot.unlocked) return 0;
  const n = MINECORE_PLANT_BASE_POWER_UNITS[slot.type] ?? 1;
  return Math.max(0, n);
}

export function isCyclePaused(slot: PlantSlotState, _now: number): boolean {
  return Boolean(slot.cycle?.pauseBeganAtMs != null);
}

/** Clock used for production math while paused. */
export function productionClockMs(slot: PlantSlotState, now: number): number {
  if (slot.cycle?.pauseBeganAtMs != null) return slot.cycle.pauseBeganAtMs;
  return now;
}

/** Full combined charge (ms) for all installed battery slots. */
export function getBatteryCapacityMs(slot: PlantSlotState): number {
  return sumChargeMs(getMaxChargePerSlotMs(slot.setup, slot.type));
}

export function getTotalBatteryChargeAtSnapshot(slot: PlantSlotState): number {
  return sumChargeMs(slot.batterySlotChargeMs ?? []);
}

// ── Core computations ────────────────────────────────────────────────────────

export function computePlantReady(state: MinecoreState, slot: PlantSlotState): boolean {
  if (!slot.unlocked) return false;
  if (!slot.setup.machineId) return false;
  if (!hasInstalledBattery(slot.setup, slot.type)) return false;
  return plantWorkerNftDeckAssignmentValid(state, slot);
}

/** One full cycle at current economy (D/24h × effective duration). */
export function computePlantExpectedDiamonds(state: MinecoreState, slot: PlantSlotState): number {
  return computeExpectedDiamondsForCycle(state, slot);
}

export function computePlantDurationMs(slot: PlantSlotState): number {
  return computeEffectiveCycleDurationMs(slot);
}

/**
 * Per-slot remaining charge at `now` (waterfall drain: slot 0 first).
 */
export function computeLiveBatterySlotChargeMs(slot: PlantSlotState, now: number): number[] {
  const raw = slot.batterySlotChargeMs ?? [];
  if (!slot.cycle || slot.cycle.endAtMs <= slot.cycle.startAtMs) {
    return [...raw];
  }
  if (slot.cycle.pauseBeganAtMs != null) {
    return [...raw];
  }
  const drainUntil = Math.min(now, slot.cycle.endAtMs);
  const elapsed = Math.max(0, drainUntil - slot.batterySnapshotAt);
  const powerFactor = getPowerDrainScale(slot);
  return drainWaterfallRemaining(raw, elapsed * powerFactor);
}

/**
 * Live total battery charge (ms). Drains at machine draw rate while a cycle is active.
 */
export function computeLiveBatteryChargeMs(slot: PlantSlotState, now: number): number {
  return sumChargeMs(computeLiveBatterySlotChargeMs(slot, now));
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
  const clock = productionClockMs(slot, now);
  const elapsed = Math.max(0, clock - slot.cycle.startAtMs);
  const factor = getPowerDrainScale(slot);
  const totalAtSnap = getTotalBatteryChargeAtSnapshot(slot);
  const emptyAtMs = factor > 0 ? slot.batterySnapshotAt + totalAtSnap / factor : Number.POSITIVE_INFINITY;
  const maxByBattery = Math.max(0, emptyAtMs - slot.cycle.startAtMs);
  const effectiveElapsed = Math.min(elapsed, maxByBattery, slot.cycle.durationMs);
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

/**
 * Progress toward this plant's rolling 24h cap (from activation): credited extract/refine + banked + live in-run.
 */
export function computePlantDailyCapProgress(
  state: MinecoreState,
  slot: PlantSlotState,
  now: number,
): { minedTowardCap: number; cap24h: number; ratio: number } {
  const rolled = rollPlantRollingDailyCapIfNeeded(slot, now);
  const cap24h = rolled.unlocked ? computePlantRollingDailyCapCeiling(state, rolled) : 0;
  const live = rolled.cycle ? computeLiveDiamonds(rolled, now) : 0;
  const minedTowardCap = rolled.dailyCapMinedDiamonds + rolled.diamondsAccumulated + live;
  const ratio = cap24h > 0 ? Math.min(1, minedTowardCap / cap24h) : 0;
  return { minedTowardCap, cap24h, ratio };
}

/** Ms until this plant's rolling 24h diamond-cap window resets (0 if locked or unanchored). */
export function computeRollingDailyCapWindowRemainingMs(slot: PlantSlotState, now: number): number {
  const rolled = rollPlantRollingDailyCapIfNeeded(slot, now);
  if (!rolled.unlocked || rolled.rollingCapWindowStartMs <= 0) return 0;
  return Math.max(0, rolled.rollingCapWindowStartMs + MINECORE_DAY_MS - now);
}

/** Game Deck: sum rolling-cap progress across unlocked plants with complete setup. */
export function computeMinecoreRollingDailyCapDeckTotals(
  state: MinecoreState,
  now: number,
): { minedSum: number; capSum: number } {
  let minedSum = 0;
  let capSum = 0;
  for (const slot of state.plantSlots) {
    if (!slot.unlocked || !computePlantReady(state, slot)) continue;
    const rolled = rollPlantRollingDailyCapIfNeeded(slot, now);
    const p = computePlantDailyCapProgress(state, rolled, now);
    minedSum += p.minedTowardCap;
    capSum += p.cap24h;
  }
  return { minedSum, capSum };
}

/** True when this plant cannot start another cycle until the rolling 24h window advances (or cap math changes). */
export function plantDailyCapPreventsNewCycle(state: MinecoreState, slot: PlantSlotState, now: number): boolean {
  const rolled = rollPlantRollingDailyCapIfNeeded(slot, now);
  const p = computePlantDailyCapProgress(state, rolled, now);
  return p.cap24h > 0 && p.minedTowardCap >= p.cap24h;
}

/** Power units mirror grid capacity — not spent per run (see `apply-event` / `deriveState`). */
export function syncPlantPowerUnitsToCapacity(slot: PlantSlotState): PlantSlotState {
  if (!slot.unlocked) return slot;
  const cap = getPowerUnitCap(slot);
  return { ...slot, powerRemaining: Math.max(0, cap) };
}

/** Foreman NFT or an installed auto-restart module (e.g. Regen Coil) unlocks automated cycle chaining. */
export function minecoreAutoRestartInfrastructureActive(state: MinecoreState): boolean {
  if (state.automation.foremanActive) return true;
  for (const slot of state.plantSlots) {
    if (!slot.unlocked || slot.type === 'standard') continue;
    for (const id of slot.setup.moduleIds) {
      if (MINECORE_MODULES[id]?.autoRestartMining) return true;
    }
  }
  return false;
}

// ── Status derivation ────────────────────────────────────────────────────────

export function deriveSlotStatus(
  state: MinecoreState,
  slot: PlantSlotState,
  now: number,
): PlantSlotState['status'] {
  if (!slot.unlocked) return 'EmptySlot';
  if (slot.needsRepair) return 'NeedsRepair';
  if (!computePlantReady(state, slot)) return 'SetupIncomplete';
  if (slot.cycle) {
    if (slot.cycle.pauseBeganAtMs != null) return 'MiningPaused';
    const liveCharge = computeLiveBatteryChargeMs(slot, now);
    if (liveCharge <= 0 && now < slot.cycle.endAtMs) return 'BatteryEmpty';
    if (now >= slot.cycle.endAtMs) return 'ExtractionReady';
    return 'MiningActive';
  }
  if (plantDailyCapPreventsNewCycle(state, slot, now)) return 'DailyCapReached';
  if (!canStartMiningByEfficiency(slot)) return 'InsufficientPower';
  return 'ReadyToMine';
}

export function deriveState(state: MinecoreState, now: number): MinecoreState {
  const nextSlots = state.plantSlots.map((s) => {
    const rolled = rollPlantRollingDailyCapIfNeeded(s, now);
    const synced = syncPlantPowerUnitsToCapacity(rolled);
    return { ...synced, status: deriveSlotStatus(state, synced, now) };
  });
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
