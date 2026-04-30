import {
  MINECORE_DAY_MS,
  MINECORE_KW_SCALE,
  MINECORE_MACHINES,
  MINECORE_MAINTENANCE_PERIOD_MS,
  MINECORE_MIN_MINING_EFFICIENCY_PCT,
  MINECORE_MODULES,
  MINECORE_BATTERIES,
  MINECORE_PLANT_BASE_DIAMONDS_PER_24H,
  MINECORE_PLANT_MAINTENANCE_MULT,
  MINECORE_PLANT_MAX_DIAMONDS_PER_24H,
  MINECORE_PLANT_BASE_PRODUCTION_KW,
  MINECORE_POWER_NODES,
  MINECORE_POWER_CRITICAL_RATIO,
} from './config';
import type { MiningSlot } from '@/lib/game/engine';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { normalizePlantSetup, plantNftSlotAssignmentValid } from './asset-usage';
import type { MinecoreComputeContext } from './compute-context';
import type { MinecoreState, PlantSlotState } from './types';
import { hasInstalledBattery } from './battery-utils';
import { computeMinecoreDailyCapBonusForPlantCrew, minecoreDeckBenefits } from './nft-deck-benefits';

/** Machine draw × installed battery bus overhead — used for kW balance, efficiency, and battery drain rate. */
export function getPlantPowerDrawFactor(slot: PlantSlotState): number {
  const machineFactor = slot.setup.machineId
    ? (MINECORE_MACHINES[slot.setup.machineId]?.powerConsumptionFactor ?? 1)
    : 1;
  let batteryOverhead = 1;
  for (const bid of slot.setup.batteryIds ?? []) {
    if (bid == null) continue;
    const m = MINECORE_BATTERIES[bid]?.powerDrawMultiplier;
    if (m != null && Number.isFinite(m) && m > 0) batteryOverhead *= m;
  }
  return machineFactor * batteryOverhead;
}

function plantPowerFactor(slot: PlantSlotState): number {
  return getPlantPowerDrawFactor(slot);
}

/** UTC calendar day for daily redeem caps. */
export function minecoreUtcDayKey(atMs: number): string {
  return new Date(atMs).toISOString().slice(0, 10);
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

/**
 * Format in-universe power for UI. Values passed in are the same kW units used by `computeConsumptionKw` / `computeProductionKw`.
 * Uses W below 1 kW, kW up to 999, MW, then GW for very large stacks.
 */
export function formatMinecorePowerDisplay(kw: number): string {
  if (!Number.isFinite(kw) || kw <= 0) return '0 kW';
  const abs = kw;
  if (abs < 1) return `${Math.round(kw * 1000)} W`;
  if (abs < 1000) return `${abs >= 10 ? abs.toFixed(0) : abs.toFixed(1)} kW`;
  const mw = kw / 1000;
  if (abs < 1_000_000) return `${mw >= 10 ? mw.toFixed(0) : mw.toFixed(2)} MW`;
  const gw = kw / 1_000_000;
  return `${gw >= 10 ? gw.toFixed(0) : gw.toFixed(2)} GW`;
}

export function computeProductionKw(slot: PlantSlotState): number {
  const plant = MINECORE_PLANT_BASE_PRODUCTION_KW[slot.type] ?? MINECORE_PLANT_BASE_PRODUCTION_KW.standard;
  const m = slot.setup.machineId ? MINECORE_MACHINES[slot.setup.machineId] : null;
  const grid = m?.powerGridContribution ?? 0;
  const nodeKw =
    slot.setup.powerNodeId != null
      ? (MINECORE_POWER_NODES[slot.setup.powerNodeId]?.maxPowerKw ?? 0)
      : 0;
  return plant + grid * MINECORE_KW_SCALE + nodeKw;
}

export function computeConsumptionKw(slot: PlantSlotState): number {
  const factor = plantPowerFactor(slot);
  let cons = factor * MINECORE_KW_SCALE;
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

/** Stability modules add percentage points after the base kW curve. */
export function computeEfficiencyBonusPoints(slot: PlantSlotState): number {
  let pts = 0;
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
 * Effective mining efficiency 0–100 from kW balance, plus stability module bonuses.
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

/** 0 = fresh service, 1 = needs repair (efficiency multiplier reaches 0). */
export function computeMaintenanceWearRatio(slot: PlantSlotState, now: number): number {
  const raw = slot.plantLastServicedAtMs;
  const start = typeof raw === 'number' && raw > 0 ? raw : now;
  const mult = MINECORE_PLANT_MAINTENANCE_MULT[slot.type] ?? 1;
  const period = MINECORE_MAINTENANCE_PERIOD_MS * mult;
  if (period <= 0) return 0;
  return Math.min(1, Math.max(0, (now - start) / period));
}

/** Grid balance × maintenance — used for live D/24h while mining. */
export function computeEffectiveMiningEfficiencyPct(slot: PlantSlotState, now: number): number {
  if (slot.needsRepair) return 0;
  const wear = computeMaintenanceWearRatio(slot, now);
  const gridEff = computeMiningEfficiencyPct(slot);
  return Math.max(0, Math.floor(gridEff * (1 - wear)));
}

function slotSetupComplete(state: MinecoreState, slot: PlantSlotState): boolean {
  return Boolean(
    slot.setup.machineId && hasInstalledBattery(slot.setup, slot.type) && plantNftSlotAssignmentValid(state, slot),
  );
}

/**
 * Flat diamond bonus toward rolling cap from this Workers-tab NFT (collection tier only).
 * Does not vary by worker/operator/foreman role; plant totals sum assigned crew only (`computeMinecoreDailyCapBonusForPlantCrew`).
 */
export function computeMiningNftDeckDiamondBonusPer24h(
  deck: MiningSlot,
  metadata?: ParsedNFTMetadata | null,
): number {
  return minecoreDeckBenefits(deck, metadata ?? null).capBonus;
}

/**
 * Maximum diamonds credited toward this plant's rolling 24h window at full mining efficiency.
 * Plant base + machine flat D/24h + **this plant’s assigned crew** NFT cap bonuses only (no battery or module % on cap).
 * (Live power deficit does not shrink this ceiling; it lowers realized output via `computePlantDiamondsPer24h`.)
 */
export function computePlantRollingDailyCapCeiling(
  state: MinecoreState,
  slot: PlantSlotState,
  ctx?: MinecoreComputeContext,
): number {
  if (!slot.unlocked || !slotSetupComplete(state, slot)) return 0;
  const machine = slot.setup.machineId ? MINECORE_MACHINES[slot.setup.machineId] : null;
  if (!machine || !hasInstalledBattery(slot.setup, slot.type)) return 0;

  const idxs = normalizePlantSetup(slot.type, slot.setup).workerNftDeckSlotIndices;
  for (const dj of idxs) {
    if (dj == null) return 0;
    const crewDeck = state.nftSlots?.[dj];
    if (!crewDeck?.collection || crewDeck.nftId == null) return 0;
  }

  const base = MINECORE_PLANT_BASE_DIAMONDS_PER_24H[slot.type] ?? MINECORE_PLANT_BASE_DIAMONDS_PER_24H.standard;
  const machinePart = machine.diamondsPer24h;

  const crewDeckCap = computeMinecoreDailyCapBonusForPlantCrew(state, slot, ctx);
  const subtotal = base + machinePart + crewDeckCap;
  const plantMax = MINECORE_PLANT_MAX_DIAMONDS_PER_24H[slot.type] ?? MINECORE_PLANT_MAX_DIAMONDS_PER_24H.standard;
  return Math.max(0, Math.min(plantMax, Math.floor(subtotal)));
}

/** Terms that add up to the rolling cap (for UI). `ceiling` matches {@link computePlantRollingDailyCapCeiling}. */
export type PlantRollingCapBreakdown = {
  plantBase: number;
  machineCap: number;
  crewCap: number;
  /** Raw sum before plant max clamp */
  subtotal: number;
  ceiling: number;
  plantMax: number;
};

export function computePlantRollingDailyCapBreakdown(
  state: MinecoreState,
  slot: PlantSlotState,
  ctx?: MinecoreComputeContext,
): PlantRollingCapBreakdown {
  const plantMax = MINECORE_PLANT_MAX_DIAMONDS_PER_24H[slot.type] ?? MINECORE_PLANT_MAX_DIAMONDS_PER_24H.standard;
  if (!slot.unlocked) {
    return { plantBase: 0, machineCap: 0, crewCap: 0, subtotal: 0, ceiling: 0, plantMax };
  }
  const plantBase = MINECORE_PLANT_BASE_DIAMONDS_PER_24H[slot.type] ?? MINECORE_PLANT_BASE_DIAMONDS_PER_24H.standard;
  const machine = slot.setup.machineId ? MINECORE_MACHINES[slot.setup.machineId] : null;
  const machineCap = machine?.diamondsPer24h ?? 0;
  const crewCap = computeMinecoreDailyCapBonusForPlantCrew(state, slot, ctx);
  const subtotal = Math.max(0, Math.floor(plantBase + machineCap + crewCap));
  const ceiling = computePlantRollingDailyCapCeiling(state, slot, ctx);
  return { plantBase, machineCap, crewCap, subtotal, ceiling, plantMax };
}

/**
 * Expected diamonds per 24h at current setup and live power efficiency (0–100%).
 * Pass `now` so maintenance wear reduces realized output.
 */
export function computePlantDiamondsPer24h(
  state: MinecoreState,
  slot: PlantSlotState,
  now?: number,
  ctx?: MinecoreComputeContext,
): number {
  const ceiling = computePlantRollingDailyCapCeiling(state, slot, ctx);
  if (ceiling <= 0) return 0;
  const t = now ?? Date.now();
  const effPct = computeEffectiveMiningEfficiencyPct(slot, t);
  return Math.max(0, Math.floor((ceiling * effPct) / 100));
}

/**
 * Expected diamonds for one full effective cycle (wall clock), from D/24h × duration.
 */
export function computeExpectedDiamondsForCycle(
  state: MinecoreState,
  slot: PlantSlotState,
  ctx?: MinecoreComputeContext,
): number {
  const d24 = computePlantDiamondsPer24h(state, slot, Date.now(), ctx);
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
