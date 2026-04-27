import {
  MINECORE_BATTERIES,
  MINECORE_BOOSTS,
  MINECORE_DAY_MS,
  MINECORE_DAILY_CAP_MAX_MACHINE_MULT,
  MINECORE_KW_SCALE,
  MINECORE_MACHINES,
  MINECORE_MIN_MINING_EFFICIENCY_PCT,
  MINECORE_MODULES,
  MINECORE_PLANT_BASE_DIAMONDS_PER_24H,
  MINECORE_PLANT_BASE_PRODUCTION_KW,
  MINECORE_POWER_CRITICAL_RATIO,
  MINECORE_WORKERS,
} from './config';
import type { MinecoreState, PlantSlotState } from './types';

function plantPowerFactor(slot: PlantSlotState): number {
  return slot.setup.machineId
    ? (MINECORE_MACHINES[slot.setup.machineId]?.powerConsumptionFactor ?? 1)
    : 1;
}

/** UTC calendar day for daily redeem caps. */
export function minecoreUtcDayKey(atMs: number): string {
  return new Date(atMs).toISOString().slice(0, 10);
}

function machineDiamondsPer24h(slot: PlantSlotState): number {
  const m = slot.setup.machineId ? MINECORE_MACHINES[slot.setup.machineId] : null;
  if (!m || m.durationMs <= 0) return 0;
  return Math.floor((m.baseOutput * MINECORE_DAY_MS) / m.durationMs);
}

/** Active automation modules lengthen the nominal cycle (longer wall clock, same D/24h rate). */
export function computeEffectiveCycleDurationMs(slot: PlantSlotState): number {
  const base = slot.setup.machineId ? (MINECORE_MACHINES[slot.setup.machineId]?.durationMs ?? 0) : 0;
  if (base <= 0) return 0;
  if (slot.type === 'standard') return base;
  let stretch = 1;
  for (const id of slot.setup.moduleIds) {
    const mod = MINECORE_MODULES[id];
    if (mod?.kind === 'automation' && mod.cycleDurationBonus != null) {
      stretch += mod.cycleDurationBonus;
    }
  }
  return Math.max(1, Math.floor(base * stretch));
}

export function computeProductionKw(slot: PlantSlotState): number {
  const plant = MINECORE_PLANT_BASE_PRODUCTION_KW[slot.type] ?? MINECORE_PLANT_BASE_PRODUCTION_KW.standard;
  const m = slot.setup.machineId ? MINECORE_MACHINES[slot.setup.machineId] : null;
  const b = slot.setup.batteryId ? MINECORE_BATTERIES[slot.setup.batteryId] : null;
  const grid = (m?.powerGridContribution ?? 0) + (b?.powerCapacity ?? 0);
  return plant + grid * MINECORE_KW_SCALE;
}

export function computeConsumptionKw(slot: PlantSlotState): number {
  const factor = plantPowerFactor(slot);
  let cons = factor * MINECORE_KW_SCALE;
  const w = slot.setup.workerId ? MINECORE_WORKERS[slot.setup.workerId] : null;
  if (w && w.energyUseReduction > 0) {
    cons *= Math.max(0.2, 1 - w.energyUseReduction);
  }
  if (slot.type !== 'standard') {
    for (const id of slot.setup.moduleIds) {
      const mod = MINECORE_MODULES[id];
      if (mod?.kind === 'cooling' && mod.consumptionReduction != null) {
        cons *= Math.max(0.15, 1 - mod.consumptionReduction);
      }
    }
  }
  return Math.max(0.5, cons);
}

export function computePowerBalanceKw(slot: PlantSlotState): number {
  return computeProductionKw(slot) - computeConsumptionKw(slot);
}

/** Stability / worker bonuses add percentage points after the base curve. */
export function computeEfficiencyBonusPoints(slot: PlantSlotState): number {
  let pts = 0;
  const w = slot.setup.workerId ? MINECORE_WORKERS[slot.setup.workerId] : null;
  if (w) pts += w.efficiencyBonus;
  if (slot.type !== 'standard') {
    for (const id of slot.setup.moduleIds) {
      const mod = MINECORE_MODULES[id];
      if (mod?.kind === 'stability' && mod.efficiencyFloorBonus != null) {
        pts += mod.efficiencyFloorBonus;
      }
    }
  }
  return pts;
}

/**
 * Effective mining efficiency 0–100 from kW balance, plus stability bonuses.
 * 100% when production >= consumption.
 */
export function computeMiningEfficiencyPct(slot: PlantSlotState): number {
  const prod = computeProductionKw(slot);
  const cons = computeConsumptionKw(slot);
  if (cons <= 0) return 100;
  const ratio = prod / cons;
  let base: number;
  if (ratio >= 1) base = 100;
  else if (ratio <= MINECORE_POWER_CRITICAL_RATIO) base = 0;
  else {
    base =
      ((ratio - MINECORE_POWER_CRITICAL_RATIO) / (1 - MINECORE_POWER_CRITICAL_RATIO)) * 100;
  }
  return Math.min(100, Math.max(0, base + computeEfficiencyBonusPoints(slot)));
}

export function canStartMiningByEfficiency(slot: PlantSlotState): boolean {
  return computeMiningEfficiencyPct(slot) >= MINECORE_MIN_MINING_EFFICIENCY_PCT;
}

function slotSetupComplete(slot: PlantSlotState): boolean {
  return Boolean(slot.setup.machineId && slot.setup.batteryId && slot.setup.workerId);
}

/**
 * Maximum diamonds credited toward this plant's rolling 24h window at full mining efficiency.
 * Structure: plant base + capped machine throughput + additive worker/output-module bonuses × boost × battery yield.
 * (Live power deficit does not shrink this ceiling; it lowers realized output via `computePlantDiamondsPer24h`.)
 */
export function computePlantRollingDailyCapCeiling(_state: MinecoreState, slot: PlantSlotState): number {
  if (!slot.unlocked || !slotSetupComplete(slot)) return 0;
  const machine = slot.setup.machineId ? MINECORE_MACHINES[slot.setup.machineId] : null;
  const worker = slot.setup.workerId ? MINECORE_WORKERS[slot.setup.workerId] : null;
  const battery = slot.setup.batteryId ? MINECORE_BATTERIES[slot.setup.batteryId] : null;
  const boost = MINECORE_BOOSTS[slot.setup.boostId];
  if (!machine || !worker || !battery) return 0;

  const base = MINECORE_PLANT_BASE_DIAMONDS_PER_24H[slot.type] ?? MINECORE_PLANT_BASE_DIAMONDS_PER_24H.standard;
  const rawMachine24 = machineDiamondsPer24h(slot);
  const machineCap = Math.floor(base * MINECORE_DAILY_CAP_MAX_MACHINE_MULT);
  const machinePart = Math.min(rawMachine24, machineCap);

  const workerPart = Math.round((base + machinePart) * worker.diamondOutputBonus);
  let modulePart = 0;
  if (slot.type !== 'standard') {
    for (const id of slot.setup.moduleIds) {
      const mod = MINECORE_MODULES[id];
      if (mod?.kind === 'output') modulePart += Math.round((base + machinePart) * mod.outputBonus);
    }
  }

  const subtotal = base + machinePart + workerPart + modulePart;
  const afterGear = subtotal * boost.multiplier * battery.efficiency;
  return Math.max(0, Math.floor(afterGear));
}

/**
 * Expected diamonds per 24h at current setup and live power efficiency (0–100%).
 */
export function computePlantDiamondsPer24h(state: MinecoreState, slot: PlantSlotState): number {
  const ceiling = computePlantRollingDailyCapCeiling(state, slot);
  if (ceiling <= 0) return 0;
  const effPct = computeMiningEfficiencyPct(slot);
  return Math.max(0, Math.floor((ceiling * effPct) / 100));
}

/**
 * Expected diamonds for one full effective cycle (wall clock), from D/24h × duration.
 */
export function computeExpectedDiamondsForCycle(state: MinecoreState, slot: PlantSlotState): number {
  const d24 = computePlantDiamondsPer24h(state, slot);
  const dur = computeEffectiveCycleDurationMs(slot);
  if (d24 <= 0 || dur <= 0) return 0;
  return Math.max(0, Math.round((d24 * dur) / MINECORE_DAY_MS));
}

/** Sum refining bonuses from all unlocked plants (for Refine event). */
export function computeGlobalRefineBonusFraction(state: MinecoreState): number {
  let frac = 0;
  for (const slot of state.plantSlots) {
    if (!slot.unlocked || slot.type === 'standard') continue;
    for (const id of slot.setup.moduleIds) {
      const mod = MINECORE_MODULES[id];
      if (mod?.kind === 'refining' && mod.refineBonus != null) {
        frac += mod.refineBonus;
      }
    }
    const w = slot.setup.workerId ? MINECORE_WORKERS[slot.setup.workerId] : null;
    if (w?.gridRewardBonus) frac += w.gridRewardBonus;
  }
  return frac;
}

/** L2 claim stub payload (no signing in V1). */
export type MinecoreClaimPayloadV1 = {
  gameId: 'minecore';
  walletAddress: string;
  refinementPoints: number;
  token: 'GRID' | 'KREX';
  dayKey: string;
  atMs: number;
};

export function buildMinecoreClaimPayloadV1(input: {
  walletAddress: string;
  refinementPoints: number;
  token: 'GRID' | 'KREX';
  atMs: number;
}): MinecoreClaimPayloadV1 {
  return {
    gameId: 'minecore',
    walletAddress: input.walletAddress,
    refinementPoints: input.refinementPoints,
    token: input.token,
    dayKey: minecoreUtcDayKey(input.atMs),
    atMs: input.atMs,
  };
}
