import {
  MINECORE_BATTERY_GRID_DRAW_BASE_KW,
  MINECORE_BATTERIES,
  MINECORE_DAY_MS,
  MINECORE_KAS_OVERCLOCK_DAILY_CAP_FLAT,
  MINECORE_KW_SCALE,
  MINECORE_KREX_BOOST_YIELD_MULT,
  MINECORE_MACHINES,
  MINECORE_MAINTENANCE_PERIOD_MS,
  MINECORE_MIN_MINING_EFFICIENCY_PCT,
  MINECORE_MODULE_DEFAULT_GRID_DRAW_KW,
  MINECORE_MODULES,
  MINECORE_PLANT_BASE_DIAMONDS_PER_24H,
  MINECORE_PLANT_MAINTENANCE_MULT,
  MINECORE_PLANT_MAX_DIAMONDS_PER_24H,
  MINECORE_PLANT_BASE_PRODUCTION_KW,
  MINECORE_POWER_NODES,
  MINECORE_POWER_CRITICAL_LOAD,
} from './config';
import type { MiningSlot } from '@/lib/game/engine';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { normalizePlantSetup, plantNftSlotAssignmentValid } from './asset-usage';
import type { MinecoreComputeContext } from './compute-context';
import type { MinecoreState, PlantSlotState } from './types';
import { hasInstalledBattery, normalizeBatteryIds } from './battery-utils';
import { computeMinecoreDailyCapBonusForPlantCrew, minecoreDeckBenefits } from './nft-deck-benefits';

/**
 * Rig power draw (kW curve) - base term for `computeConsumptionKw` / grid efficiency.
 * Batteries and modules add extra draw on top; see `computeConsumptionKw`.
 */
export function getPlantPowerDrawFactor(slot: PlantSlotState): number {
  return slot.setup.machineId
    ? (MINECORE_MACHINES[slot.setup.machineId]?.powerConsumptionFactor ?? 1)
    : 1;
}

function plantPowerFactor(slot: PlantSlotState): number {
  return getPlantPowerDrawFactor(slot);
}

/**
 * Diamonds accrue faster with better rigs and output-style modules (excluding krex-boost; cap already applies KREX yield there).
 */
export function computePlantMiningSpeedMultiplier(slot: PlantSlotState): number {
  const machine = slot.setup.machineId ? MINECORE_MACHINES[slot.setup.machineId] : null;
  let m = machine?.miningSpeedMultiplier ?? 1;
  if (!Number.isFinite(m) || m < 1) m = 1;

  if (slot.type === 'standard') return m;

  for (const id of slot.setup.moduleIds) {
    if (id === 'krex-boost') continue;
    const mod = MINECORE_MODULES[id];
    const b = mod?.outputBonus;
    if (b != null && Number.isFinite(b) && b > 0) {
      m *= 1 + b;
    }
  }
  return m;
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
  let nodeKw = 0;
  for (const nid of normalizePlantSetup(slot.type, slot.setup).powerNodeIds) {
    if (nid) nodeKw += MINECORE_POWER_NODES[nid]?.maxPowerKw ?? 0;
  }
  return plant + grid * MINECORE_KW_SCALE + nodeKw;
}

export function computeConsumptionKw(slot: PlantSlotState): number {
  const setup = normalizePlantSetup(slot.type, slot.setup);
  const factor = plantPowerFactor(slot);
  let cons = factor * MINECORE_KW_SCALE;

  for (const bid of normalizeBatteryIds(setup, slot.type)) {
    if (!bid) continue;
    const mult = MINECORE_BATTERIES[bid]?.powerDrawMultiplier ?? 1;
    cons += mult * MINECORE_BATTERY_GRID_DRAW_BASE_KW;
  }

  if (slot.type !== 'standard') {
    for (const id of setup.moduleIds) {
      const mod = MINECORE_MODULES[id];
      if (!mod) continue;
      cons += mod.gridConsumptionKw ?? MINECORE_MODULE_DEFAULT_GRID_DRAW_KW;
    }
  }

  if (slot.type !== 'standard') {
    for (const id of setup.moduleIds) {
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
 * Grid load: consumption / max supply (plant + rig bus + reactor).
 * 1.0 = fully loaded; values above 1 mean draw exceeds capacity before other limits.
 */
export function computePlantPowerLoadRatio(slot: PlantSlotState): number {
  const prod = computeProductionKw(slot);
  const cons = computeConsumptionKw(slot);
  if (prod <= 1e-9) return Number.POSITIVE_INFINITY;
  return cons / prod;
}

export function powerLoadZoneLabel(loadRatio: number): 'optimal' | 'good' | 'strained' | 'critical' {
  if (!Number.isFinite(loadRatio) || loadRatio > MINECORE_POWER_CRITICAL_LOAD) return 'critical';
  if (loadRatio <= 0.25) return 'optimal';
  if (loadRatio <= 0.5) return 'good';
  if (loadRatio <= MINECORE_POWER_CRITICAL_LOAD) return 'strained';
  return 'critical';
}

/**
 * Effective mining efficiency 0–100 from grid load bands (plus stability module bonus).
 * Bands: 0–25% load optimal, 25–50% good, 50–75% strained, above 75% critical (mining halts).
 */
export function computeMiningEfficiencyPct(slot: PlantSlotState): number {
  const L = computePlantPowerLoadRatio(slot);
  if (L > MINECORE_POWER_CRITICAL_LOAD) return 0;

  let base: number;
  if (L <= 0.25) {
    base = 100;
  } else if (L <= 0.5) {
    base = 100 - ((L - 0.25) / 0.25) * 10;
  } else if (L <= MINECORE_POWER_CRITICAL_LOAD) {
    base = 90 - ((L - 0.5) / (MINECORE_POWER_CRITICAL_LOAD - 0.5)) * 40;
  } else {
    base = 0;
  }
  return Math.min(100, Math.max(0, base + computeEfficiencyBonusPoints(slot)));
}

export function canStartMiningByEfficiency(slot: PlantSlotState): boolean {
  if (computePlantPowerLoadRatio(slot) > MINECORE_POWER_CRITICAL_LOAD) return false;
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

/** Grid balance × maintenance - used for live D/24h while mining. */
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
/** Active when KREX Boost is slotted and its timer has not expired. */
export function computePlantKrexYieldMultiplier(slot: PlantSlotState, atMs: number): number {
  const until = slot.krexBoostUntilMs ?? 0;
  if (until > 0 && atMs < until && slot.setup.moduleIds.includes('krex-boost')) {
    return MINECORE_KREX_BOOST_YIELD_MULT;
  }
  return 1;
}

/** Flat bonus diamonds/24h added to rolling cap while KAS Overclock window is active. */
export function computePlantKasOverclockDailyFlat(slot: PlantSlotState, atMs: number): number {
  const until = slot.kasOverclockDailyBonusUntilMs ?? 0;
  if (until > 0 && atMs < until) return MINECORE_KAS_OVERCLOCK_DAILY_CAP_FLAT;
  return 0;
}

export function computePlantRollingDailyCapCeiling(
  state: MinecoreState,
  slot: PlantSlotState,
  ctx?: MinecoreComputeContext,
  atMs: number = Date.now(),
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
  const withOverclock = subtotal + computePlantKasOverclockDailyFlat(slot, atMs);
  const mult = computePlantKrexYieldMultiplier(slot, atMs);
  const plantMax = MINECORE_PLANT_MAX_DIAMONDS_PER_24H[slot.type] ?? MINECORE_PLANT_MAX_DIAMONDS_PER_24H.standard;
  return Math.max(0, Math.min(plantMax, Math.floor(withOverclock * mult)));
}

/** Terms that add up to the rolling cap (for UI). `ceiling` matches {@link computePlantRollingDailyCapCeiling}. */
export type PlantRollingCapBreakdown = {
  plantBase: number;
  machineCap: number;
  crewCap: number;
  /** Plant + rig + crew before boosts */
  subtotal: number;
  /** KAS Overclock bonus added to rolling cap (/24h) while active */
  kasOverclockFlat: number;
  /** KREX Boost yield multiplier on rolling cap (1 when inactive) */
  krexYieldMult: number;
  /** Floor after yield mult, before tier max clamp */
  floorAfterYieldMult: number;
  ceiling: number;
  plantMax: number;
};

export function computePlantRollingDailyCapBreakdown(
  state: MinecoreState,
  slot: PlantSlotState,
  ctx?: MinecoreComputeContext,
  atMs: number = Date.now(),
): PlantRollingCapBreakdown {
  const plantMax = MINECORE_PLANT_MAX_DIAMONDS_PER_24H[slot.type] ?? MINECORE_PLANT_MAX_DIAMONDS_PER_24H.standard;
  if (!slot.unlocked) {
    return {
      plantBase: 0,
      machineCap: 0,
      crewCap: 0,
      subtotal: 0,
      kasOverclockFlat: 0,
      krexYieldMult: 1,
      floorAfterYieldMult: 0,
      ceiling: 0,
      plantMax,
    };
  }
  const plantBase = MINECORE_PLANT_BASE_DIAMONDS_PER_24H[slot.type] ?? MINECORE_PLANT_BASE_DIAMONDS_PER_24H.standard;
  const machine = slot.setup.machineId ? MINECORE_MACHINES[slot.setup.machineId] : null;
  const machineCap = machine?.diamondsPer24h ?? 0;
  const crewCap = computeMinecoreDailyCapBonusForPlantCrew(state, slot, ctx);
  const subtotal = Math.max(0, Math.floor(plantBase + machineCap + crewCap));
  const kasOverclockFlat = computePlantKasOverclockDailyFlat(slot, atMs);
  const krexYieldMult = computePlantKrexYieldMultiplier(slot, atMs);
  const floorAfterYieldMult = Math.max(0, Math.floor((subtotal + kasOverclockFlat) * krexYieldMult));
  const ceiling = computePlantRollingDailyCapCeiling(state, slot, ctx, atMs);
  return {
    plantBase,
    machineCap,
    crewCap,
    subtotal,
    kasOverclockFlat,
    krexYieldMult,
    floorAfterYieldMult,
    ceiling,
    plantMax,
  };
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
  const t = now ?? Date.now();
  const ceiling = computePlantRollingDailyCapCeiling(state, slot, ctx, t);
  if (ceiling <= 0) return 0;
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
  atMs: number = Date.now(),
): number {
  const d24 = computePlantDiamondsPer24h(state, slot, atMs, ctx);
  const dur = computeEffectiveCycleDurationMs(slot);
  if (d24 <= 0 || dur <= 0) return 0;
  const speed = computePlantMiningSpeedMultiplier(slot);
  return Math.max(0, Math.round(((d24 * dur) / MINECORE_DAY_MS) * speed));
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
