/**
 * Live mining progress is derived from persisted `PlantSlotState` timestamps (`cycle`, `batterySnapshotAt`)
 * and wall-clock `now`, so reconnecting applies the same deterministic math offline (tab may be closed).
 */
import { MINECORE_DAY_MS, MINECORE_MODULES, MINECORE_PLANT_BASE_POWER_UNITS } from './config';
import type { MinecoreComputeContext } from './compute-context';
import {
  drainWaterfallRemaining,
  getMaxChargePerSlotMs,
  hasInstalledBattery,
  sumChargeMs,
} from './battery-utils';
import type { MinecoreState, PlantSlotState } from './types';
import { computeMinecoreBatteryBonusMsPerSlot } from './nft-deck-benefits';
import {
  plantNftSlotAssignmentValid,
} from './asset-usage';
import {
  canStartMiningByEfficiency,
  computeExpectedDiamondsForCycle,
  computeEffectiveCycleDurationMs,
  computeMaintenanceWearRatio,
  computePlantDiamondsPer24h,
  computePlantMiningSpeedMultiplier,
  computePlantRollingDailyCapCeiling,
} from './plant-economy';
import { rollPlantRollingDailyCapIfNeeded } from './daily-cap';

/** Nominal drain: elapsed wall time consumes stored charge 1:1 (rigs/modules do not shorten battery runtime). */
const BATTERY_CHARGE_DRAIN_RATE = 1;

/**
 * @deprecated Battery drain no longer scales with rig tier; retained as `1` for save/API compatibility.
 */
export function getPowerDrainScale(_slot: PlantSlotState): number {
  return BATTERY_CHARGE_DRAIN_RATE;
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

/** Full combined charge (ms) for all installed battery slots (includes global Workers NFT bonus when `state` passed). */
export function getBatteryCapacityMs(
  slot: PlantSlotState,
  state?: MinecoreState,
  ctx?: MinecoreComputeContext,
): number {
  const extra = state ? computeMinecoreBatteryBonusMsPerSlot(state, ctx) : 0;
  return sumChargeMs(getMaxChargePerSlotMs(slot.setup, slot.type, extra));
}

export function getTotalBatteryChargeAtSnapshot(slot: PlantSlotState): number {
  return sumChargeMs(slot.batterySlotChargeMs ?? []);
}

// ── Core computations ────────────────────────────────────────────────────────

export function computePlantReady(state: MinecoreState, slot: PlantSlotState): boolean {
  if (!slot.unlocked) return false;
  if (!slot.setup.machineId) return false;
  if (!hasInstalledBattery(slot.setup, slot.type)) return false;
  return plantNftSlotAssignmentValid(state, slot);
}

/** One full cycle at current economy (D/24h × effective duration). */
export function computePlantExpectedDiamonds(
  state: MinecoreState,
  slot: PlantSlotState,
  ctx?: MinecoreComputeContext,
  atMs: number = Date.now(),
): number {
  return computeExpectedDiamondsForCycle(state, slot, ctx, atMs);
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
  /** Mine-as-you-go: drain until battery empty - nominal cycle end does not stop drain. */
  const drainUntil = now;
  const elapsed = Math.max(0, drainUntil - slot.batterySnapshotAt);
  return drainWaterfallRemaining(raw, elapsed * BATTERY_CHARGE_DRAIN_RATE);
}

/**
 * Live total battery charge (ms).
 */
export function computeLiveBatteryChargeMs(slot: PlantSlotState, now: number): number {
  return sumChargeMs(computeLiveBatterySlotChargeMs(slot, now));
}

/** Remaining stored charge while mining (same basis as nominal cell capacity). */
export function computeBatteryRuntimeMs(slot: PlantSlotState, now: number): number {
  return Math.max(0, computeLiveBatteryChargeMs(slot, now));
}

/**
 * Raw diamonds accumulated this mining session (integral rate × elapsed), capped by battery drain and rolling daily budget headroom.
 */
export function computeRawLiveDiamonds(
  state: MinecoreState,
  slot: PlantSlotState,
  now: number,
  ctx?: MinecoreComputeContext,
): number {
  if (!slot.cycle) return 0;
  const clock = productionClockMs(slot, now);
  const elapsed = Math.max(0, clock - slot.cycle.startAtMs);
  const totalAtSnap = getTotalBatteryChargeAtSnapshot(slot);
  const emptyAtMs = slot.batterySnapshotAt + totalAtSnap / BATTERY_CHARGE_DRAIN_RATE;
  const maxByBatteryMs = Math.max(0, emptyAtMs - slot.cycle.startAtMs);
  const effectiveElapsedMs = Math.min(elapsed, maxByBatteryMs);

  const d24 = computePlantDiamondsPer24h(state, slot, now, ctx);
  const speedMult = computePlantMiningSpeedMultiplier(slot);
  const rawUncapped = Math.floor(((effectiveElapsedMs / MINECORE_DAY_MS) * d24 * speedMult));

  const rolled = rollPlantRollingDailyCapIfNeeded(slot, now);
  const cap24h = computePlantRollingDailyCapCeiling(state, rolled, ctx, now);
  const maxLive = Math.max(0, cap24h - rolled.dailyCapMinedDiamonds - rolled.diamondsAccumulated);
  return Math.min(rawUncapped, maxLive);
}

/** Diamonds remaining in the active session (after Refine siphon via `mintedOffset`). */
export function computeLiveDiamonds(
  state: MinecoreState,
  slot: PlantSlotState,
  now: number,
  ctx?: MinecoreComputeContext,
): number {
  if (!slot.cycle) return 0;
  const raw = computeRawLiveDiamonds(state, slot, now, ctx);
  const off = slot.cycle.mintedOffset ?? 0;
  return Math.max(0, raw - off);
}

/**
 * D/min production rate (live, based on machine + current setup).
 * Returns 0 when battery is depleted or no cycle is active.
 */
export function computeFlowRatePerMin(
  state: MinecoreState,
  slot: PlantSlotState,
  now: number,
  ctx?: MinecoreComputeContext,
): number {
  if (!slot.cycle) return 0;
  if (isCyclePaused(slot, now)) return 0;
  const liveCharge = computeLiveBatteryChargeMs(slot, now);
  if (liveCharge <= 0) return 0;
  const d24 = computePlantDiamondsPer24h(state, slot, now, ctx);
  const speedMult = computePlantMiningSpeedMultiplier(slot);
  const perMs = d24 / MINECORE_DAY_MS;
  return perMs * 60_000 * speedMult;
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
  ctx?: MinecoreComputeContext,
): { minedTowardCap: number; cap24h: number; ratio: number } {
  const rolled = rollPlantRollingDailyCapIfNeeded(slot, now);
  const cap24h = rolled.unlocked ? computePlantRollingDailyCapCeiling(state, rolled, ctx, now) : 0;
  const live = rolled.cycle ? computeLiveDiamonds(state, rolled, now, ctx) : 0;
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
  ctx?: MinecoreComputeContext,
): { minedSum: number; capSum: number } {
  let minedSum = 0;
  let capSum = 0;
  for (const slot of state.plantSlots) {
    if (!slot.unlocked || !computePlantReady(state, slot)) continue;
    const rolled = rollPlantRollingDailyCapIfNeeded(slot, now);
    const p = computePlantDailyCapProgress(state, rolled, now, ctx);
    minedSum += p.minedTowardCap;
    capSum += p.cap24h;
  }
  return { minedSum, capSum };
}

/** True when this plant cannot start another cycle until the rolling 24h window advances (or cap math changes). */
export function plantDailyCapPreventsNewCycle(
  state: MinecoreState,
  slot: PlantSlotState,
  now: number,
  ctx?: MinecoreComputeContext,
): boolean {
  const rolled = rollPlantRollingDailyCapIfNeeded(slot, now);
  const p = computePlantDailyCapProgress(state, rolled, now, ctx);
  return p.cap24h > 0 && p.minedTowardCap >= p.cap24h;
}

/** Power units mirror grid capacity - not spent per run (see `apply-event` / `deriveState`). */
export function syncPlantPowerUnitsToCapacity(slot: PlantSlotState): PlantSlotState {
  if (!slot.unlocked) return slot;
  const cap = getPowerUnitCap(slot);
  return { ...slot, powerRemaining: Math.max(0, cap) };
}

/** True when at least one Foreman NFT is assigned in the crew deck (unlocks AUTO controls on Mining plants). */
export function minecoreForemanDeployed(state: MinecoreState): boolean {
  return Boolean(state.nftSlots?.some((x) => x.type === 'foreman' && x.nftId != null && x.collection));
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
  ctx?: MinecoreComputeContext,
): PlantSlotState['status'] {
  if (!slot.unlocked) return 'EmptySlot';
  const wear = computeMaintenanceWearRatio(slot, now);
  if (wear >= 1 || slot.needsRepair) return 'NeedsRepair';
  if (!computePlantReady(state, slot)) return 'SetupIncomplete';
  if (slot.cycle) {
    if (slot.cycle.pauseBeganAtMs != null) return 'MiningPaused';
    const capProg = computePlantDailyCapProgress(state, slot, now, ctx);
    if (capProg.cap24h > 0 && capProg.minedTowardCap >= capProg.cap24h) return 'CreditingReady';
    const liveCharge = computeLiveBatteryChargeMs(slot, now);
    if (liveCharge <= 0) return 'BatteryEmpty';
    return 'MiningActive';
  }
  if (plantDailyCapPreventsNewCycle(state, slot, now, ctx)) return 'DailyCapReached';
  if (!canStartMiningByEfficiency(slot)) return 'InsufficientPower';
  return 'ReadyToMine';
}

export function deriveState(state: MinecoreState, now: number, ctx?: MinecoreComputeContext): MinecoreState {
  const nextSlots = state.plantSlots.map((s) => {
    const rolled = rollPlantRollingDailyCapIfNeeded(s, now);
    const synced = syncPlantPowerUnitsToCapacity(rolled);
    return { ...synced, status: deriveSlotStatus(state, synced, now, ctx) };
  });
  return { ...state, plantSlots: nextSlots };
}

/** Wallet balance plus diamonds locked in active cycles. */
export function computeMinecoreDiamondsDisplayTotal(
  state: MinecoreState,
  now: number,
  ctx?: MinecoreComputeContext,
): number {
  const inPlants = state.plantSlots.reduce(
    (acc, p) => acc + p.diamondsAccumulated + (p.cycle ? computeLiveDiamonds(state, p, now, ctx) : 0),
    0,
  );
  return state.diamondsBalance + inPlants;
}
