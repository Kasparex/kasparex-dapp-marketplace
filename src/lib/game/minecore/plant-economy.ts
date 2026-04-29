import {
  MINECORE_DAY_MS,
  MINECORE_KW_SCALE,
  MINECORE_MACHINES,
  MINECORE_MAINTENANCE_PERIOD_MS,
  MINECORE_MIN_MINING_EFFICIENCY_PCT,
  MINECORE_MODULES,
  MINECORE_PLANT_BASE_DIAMONDS_PER_24H,
  MINECORE_PLANT_MAINTENANCE_MULT,
  MINECORE_PLANT_MAX_DIAMONDS_PER_24H,
  MINECORE_PLANT_BASE_PRODUCTION_KW,
  MINECORE_POWER_CRITICAL_RATIO,
} from './config';
import type { MiningSlot } from '@/lib/game/engine';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { normalizePlantSetup, plantNftSlotAssignmentValid } from './asset-usage';
import type { MinecoreComputeContext } from './compute-context';
import type { MinecoreState, PlantSlotState } from './types';
import { hasInstalledBattery } from './battery-utils';
import { computeMinecoreDailyCapBonusFromNfts, minecoreDeckBenefits } from './nft-deck-benefits';

function plantPowerFactor(slot: PlantSlotState): number {
  return slot.setup.machineId
    ? (MINECORE_MACHINES[slot.setup.machineId]?.powerConsumptionFactor ?? 1)
    : 1;
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

export function computeProductionKw(slot: PlantSlotState): number {
  const plant = MINECORE_PLANT_BASE_PRODUCTION_KW[slot.type] ?? MINECORE_PLANT_BASE_PRODUCTION_KW.standard;
  const m = slot.setup.machineId ? MINECORE_MACHINES[slot.setup.machineId] : null;
  const grid = m?.powerGridContribution ?? 0;
  return plant + grid * MINECORE_KW_SCALE;
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
 * Flat diamond bonus toward rolling cap from this Workers-tab NFT (collection tier only — same rule as global deck).
 * Does not vary by worker/operator/foreman role; deployment bonuses are global in `computeMinecoreDailyCapBonusFromNfts`.
 */
export function computeMiningNftDeckDiamondBonusPer24h(
  deck: MiningSlot,
  metadata?: ParsedNFTMetadata | null,
): number {
  return minecoreDeckBenefits(deck, metadata ?? null).capBonus;
}

/**
 * Maximum diamonds credited toward this plant's rolling 24h window at full mining efficiency.
 * Plant base + machine flat D/24h + global Workers-tab NFT cap bonuses (no battery yield, boost, or output-module % mult).
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

  /** Workers-tab NFTs: collection-based rolling cap only (no role/yield/speed multipliers). */
  const globalDeckCap = computeMinecoreDailyCapBonusFromNfts(state, ctx);
  const subtotal = base + machinePart + globalDeckCap;
  const plantMax = MINECORE_PLANT_MAX_DIAMONDS_PER_24H[slot.type] ?? MINECORE_PLANT_MAX_DIAMONDS_PER_24H.standard;
  return Math.max(0, Math.min(plantMax, Math.floor(subtotal)));
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
