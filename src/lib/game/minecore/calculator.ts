import {
  MINECORE_GRID_PER_REFINEMENT_POINT,
  MINECORE_KREX_PER_REFINEMENT_POINT,
  MINECORE_PLANT_PRESETS,
  MINECORE_PLANT_RECHARGE_COST_KAS,
  MINECORE_REFINE_POINTS_PER_DIAMOND,
  MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
  MINECORE_DEFAULT_NEXT_SLOT_COST_KAS,
} from './config';
import {
  computePlantDurationMs,
  computePlantExpectedDiamonds,
  getBatteryCapacityMs,
  getPowerDrainScale,
  getPowerUnitCap,
} from './compute';
import { getMaxChargePerSlotMs } from './battery-utils';
import { createInitialMinecoreState } from './initial-state';
import { KREXPRIME_DIAMOND_IDS, RAREST_NFT_IDS } from '@/lib/game/diamond-veins-config';
import type {
  MinecoreBatteryId,
  MinecoreBoostId,
  MinecoreIngredient,
  MinecoreMachineId,
  MinecoreModuleId,
  MinecoreState,
  PlantSlotState,
  PlantType,
  PlantSetup,
} from './types';

/** Stable display / slider order (matches game tier progression). */
export const CALC_MACHINE_ORDER = [
  'pulse-drill',
  'crystal-extractor',
  'deep-vein-rig',
  'magma-tap',
  'orbit-siphon',
  'quantum-fracturer',
] as const satisfies readonly MinecoreMachineId[];

export const CALC_BATTERY_ORDER = [
  'energy-cell',
  'battery-pack',
  'diamond-capacitor',
  'flux-array',
  'grid-battery',
  'void-core-cell',
] as const satisfies readonly MinecoreBatteryId[];

export const CALC_WORKER_TIER_ORDER = ['regular', 'diamond', 'rarest'] as const;

export type CalculatorWorkerTier = (typeof CALC_WORKER_TIER_ORDER)[number];

export const CALC_BOOST_ORDER = [
  'none',
  'krex-boost',
  'kas-overclock',
  'grid-efficiency',
] as const satisfies readonly MinecoreBoostId[];

export const CALC_MODULE_ORDER = [
  'cooling-module',
  'stability-module',
  'aria-sensor',
  'vector-drill-chip',
  'regen-coil',
  'hash-buffer',
] as const satisfies readonly MinecoreModuleId[];

export const CALC_PLANT_TYPE_ORDER: readonly PlantType[] = ['standard', 'premium', 'advanced'];

/** Base KAS price per ingredient (Minecore shop — KAS column). */
export const CALC_INGREDIENT_KAS: Record<MinecoreIngredient, number> = {
  crystalDust: 0.5,
  alloyPlates: 2,
  circuitMesh: 1.5,
  energyCells: 3,
  coreShards: 0,
  coolingGel: 0,
  ariaChips: 0,
  nullFragments: 0,
  fluxCoils: 1.2,
  latticeWire: 2.5,
};

function calculatorMinecoreStateForTier(tier: 'regular' | 'diamond' | 'rarest'): MinecoreState {
  const s = createInitialMinecoreState();
  const nftId =
    tier === 'rarest'
      ? (RAREST_NFT_IDS.KREXPRIME?.[0] ?? 345)
      : tier === 'diamond'
        ? (KREXPRIME_DIAMOND_IDS[0] ?? 301)
        : 1;
  const slots = [...(s.nftSlots ?? [])];
  if (slots[0]) slots[0] = { ...slots[0], type: 'worker', nftId, collection: 'KREXPRIME' };
  return { ...s, nftSlots: slots };
}

export function buildCalculatorSlot(setup: PlantSetup, plantType: PlantType): PlantSlotState {
  return {
    id: 'calc',
    index: 0,
    unlocked: true,
    unlockCostKas: 1,
    type: plantType,
    status: 'ReadyToMine',
    setup,
    cycle: null,
    powerRemaining: 99,
    needsRepair: false,
    batterySlotChargeMs: getMaxChargePerSlotMs(setup, plantType),
    batterySnapshotAt: 0,
    diamondsAccumulated: 0,
    rollingCapWindowStartMs: 1,
    dailyCapMinedDiamonds: 0,
  };
}

function diamondsForPartialCycle(expected: number, durationMs: number, effectiveMs: number): number {
  if (durationMs <= 0) return 0;
  return Math.max(0, Math.floor((Math.min(effectiveMs, durationMs) / durationMs) * expected));
}

export type MinecoreCalculatorInput = {
  setup: PlantSetup;
  plantType: PlantType;
  /** Parallel plants using the same build (1–4). */
  plantCount: number;
  /** KAS shop discount 0–100 (KREX tier, etc.). */
  kasDiscountPct: number;
  /** Synthetic Worker NFT tier for yield preview (matches deployed Worker deck NFT tier bands). */
  workerTier: CalculatorWorkerTier;
};

export type MinecoreCalculatorResult = {
  expectedDiamondsFullCycle: number;
  /** After battery depletion vs cycle length (game-accurate partial). */
  diamondsThisCycle: number;
  cycleDurationMs: number;
  cycleDurationLabel: string;
  batteryCapacityMs: number;
  batteryCapacityLabel: string;
  drainScale: number;
  batteryRuntimeMs: number;
  batteryRuntimeLabel: string;
  batteryLimitsCycle: boolean;
  flowDiamondsPerMinute: number;
  reserveCap: number;
  refinementPointsPerCycle: number;
  gridRedeemablePerCycle: number;
  /** RewardsRedeemSection UI preview: points × MINECORE_GRID_PER_REFINEMENT_POINT. */
  redeemGridPreview: number;
  /** RewardsRedeemSection UI preview: points × MINECORE_KREX_PER_REFINEMENT_POINT. */
  redeemKrexPreview: number;
  /** One plant recharge SKU (1 reserve + full battery). */
  kasPerRecharge: number;
  kasPerRechargeDiscounted: number;
  /** If every cycle is paid recharge (upper bound). */
  kasPerCycleOperatingUpper: number;
  plantUpgradeKas: number;
  plantUpgradeKasDiscounted: number;
  slotUnlockKas: number;
  slotExpandKas: number;
  diamondsPerHourOnePlant: number;
  diamondsPerHourAllPlants: number;
  refinementPointsPerHourAllPlants: number;
};

function formatDuration(ms: number): string {
  if (ms <= 0) return '—';
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return `${h} h`;
  return `${h} h ${r} min`;
}

function applyKasDiscount(kas: number, pct: number): number {
  const d = Math.max(0, Math.min(100, pct));
  return Math.max(0, Math.round(kas * (1 - d / 100) * 10_000) / 10_000);
}

export function runMinecoreCalculator(input: MinecoreCalculatorInput): MinecoreCalculatorResult {
  const { setup, plantType, plantCount, kasDiscountPct, workerTier } = input;
  const slot = buildCalculatorSlot(setup, plantType);
  const mcState = calculatorMinecoreStateForTier(workerTier);
  const expected = computePlantExpectedDiamonds(mcState, slot);
  const durationMs = computePlantDurationMs(slot);
  const capMs = getBatteryCapacityMs(slot);
  const drain = getPowerDrainScale(slot);
  const runtimeMs = drain > 0 ? capMs / drain : 0;
  const effectiveMs = Math.min(runtimeMs, durationMs);
  const partial = diamondsForPartialCycle(expected, durationMs, effectiveMs);

  const perMs = durationMs > 0 ? expected / durationMs : 0;
  const flow = capMs > 0 && drain > 0 && durationMs > 0 ? perMs * 60_000 : 0;

  const wallHours = effectiveMs / 3_600_000;
  const dPerHour = wallHours > 0 ? partial / wallHours : 0;
  const n = Math.max(1, Math.min(4, Math.floor(plantCount)));

  const refine = partial * MINECORE_REFINE_POINTS_PER_DIAMOND;
  const gridR = refine * MINECORE_GRID_PER_REFINEMENT_POINT;

  const kasRecharge = MINECORE_PLANT_RECHARGE_COST_KAS;
  const kasRechargeD = applyKasDiscount(kasRecharge, kasDiscountPct);

  const preset = MINECORE_PLANT_PRESETS[plantType];
  const upgradeKas = preset.costKas;
  const upgradeKasD = applyKasDiscount(upgradeKas, kasDiscountPct);

  return {
    expectedDiamondsFullCycle: expected,
    diamondsThisCycle: partial,
    cycleDurationMs: durationMs,
    cycleDurationLabel: formatDuration(durationMs),
    batteryCapacityMs: capMs,
    batteryCapacityLabel: formatDuration(capMs),
    drainScale: drain,
    batteryRuntimeMs: runtimeMs,
    batteryRuntimeLabel: formatDuration(runtimeMs),
    batteryLimitsCycle: runtimeMs < durationMs - 1e-6,
    flowDiamondsPerMinute: flow,
    reserveCap: getPowerUnitCap(slot),
    refinementPointsPerCycle: refine,
    gridRedeemablePerCycle: gridR,
    redeemGridPreview: refine * MINECORE_GRID_PER_REFINEMENT_POINT,
    redeemKrexPreview: refine * MINECORE_KREX_PER_REFINEMENT_POINT,
    kasPerRecharge: kasRecharge,
    kasPerRechargeDiscounted: kasRechargeD,
    kasPerCycleOperatingUpper: kasRechargeD,
    plantUpgradeKas: upgradeKas,
    plantUpgradeKasDiscounted: upgradeKasD,
    slotUnlockKas: MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
    slotExpandKas: MINECORE_DEFAULT_NEXT_SLOT_COST_KAS,
    diamondsPerHourOnePlant: dPerHour,
    diamondsPerHourAllPlants: dPerHour * n,
    refinementPointsPerHourAllPlants: dPerHour * n * MINECORE_REFINE_POINTS_PER_DIAMOND,
  };
}
