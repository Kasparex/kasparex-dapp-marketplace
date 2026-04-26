import {
  MINECORE_GRID_REDEEM_RATE,
  MINECORE_PLANT_PRESETS,
  MINECORE_PLANT_RECHARGE_COST_KAS,
  MINECORE_POWER_SOURCES,
  MINECORE_REFINE_RATE,
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
import { createInitialMinecoreState } from './initial-state';
import type {
  MinecoreBatteryId,
  MinecoreBoostId,
  MinecoreIngredient,
  MinecoreMachineId,
  MinecoreModuleId,
  MinecorePowerSourceId,
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
  'quantum-fracturer',
] as const satisfies readonly MinecoreMachineId[];

export const CALC_BATTERY_ORDER = [
  'energy-cell',
  'battery-pack',
  'diamond-capacitor',
  'grid-battery',
] as const satisfies readonly MinecoreBatteryId[];

export const CALC_WORKER_ORDER = ['worker', 'operator'] as const;

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
] as const satisfies readonly MinecoreModuleId[];

/** Index 0 = no on-site power plant. */
export const CALC_POWER_ORDER: readonly (MinecorePowerSourceId | null)[] = [
  null,
  'vein-thermal',
  'fission-bdag',
  'krex-catalyst',
  'aria-photon',
  'null-reactor',
];

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
};

const DUMMY: MinecoreState = createInitialMinecoreState();

export function buildCalculatorSlot(setup: PlantSetup, plantType: PlantType): PlantSlotState {
  const cap = getBatteryCapacityMs({
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
    batteryChargeMs: 0,
    batterySnapshotAt: 0,
    diamondsAccumulated: 0,
  });
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
    batteryChargeMs: cap,
    batterySnapshotAt: 0,
    diamondsAccumulated: 0,
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
  /** RewardsRedeemSection UI preview: points × 100. */
  redeemGridPreview: number;
  /** RewardsRedeemSection UI preview: points × 10. */
  redeemKrexPreview: number;
  /** One plant recharge SKU (1 reserve + full battery). */
  kasPerRecharge: number;
  kasPerRechargeDiscounted: number;
  /** If every cycle is paid recharge (upper bound). */
  kasPerCycleOperatingUpper: number;
  plantUpgradeKas: number;
  plantUpgradeKasDiscounted: number;
  powerInstallKasEstimate: number;
  powerInstallKasDiscounted: number;
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

export function estimatePowerInstallKas(powerSourceId: MinecorePowerSourceId | null, discountPct: number): number {
  if (!powerSourceId) return 0;
  const cfg = MINECORE_POWER_SOURCES[powerSourceId];
  let sum = 0;
  for (const [k, v] of Object.entries(cfg.installRequires)) {
    const qty = typeof v === 'number' ? v : 0;
    const unit = CALC_INGREDIENT_KAS[k as MinecoreIngredient] ?? 0;
    sum += qty * unit;
  }
  return applyKasDiscount(sum, discountPct);
}

export function runMinecoreCalculator(input: MinecoreCalculatorInput): MinecoreCalculatorResult {
  const { setup, plantType, plantCount, kasDiscountPct } = input;
  const slot = buildCalculatorSlot(setup, plantType);
  const expected = computePlantExpectedDiamonds(DUMMY, slot);
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

  const refine = partial * MINECORE_REFINE_RATE;
  const gridR = refine * MINECORE_GRID_REDEEM_RATE;

  const kasRecharge = MINECORE_PLANT_RECHARGE_COST_KAS;
  const kasRechargeD = applyKasDiscount(kasRecharge, kasDiscountPct);

  const preset = MINECORE_PLANT_PRESETS[plantType];
  const upgradeKas = preset.costKas;
  const upgradeKasD = applyKasDiscount(upgradeKas, kasDiscountPct);

  let rawPowerKas = 0;
  if (setup.powerSourceId) {
    const cfg = MINECORE_POWER_SOURCES[setup.powerSourceId];
    for (const [k, v] of Object.entries(cfg.installRequires)) {
      const qty = typeof v === 'number' ? v : 0;
      rawPowerKas += qty * (CALC_INGREDIENT_KAS[k as MinecoreIngredient] ?? 0);
    }
  }
  const powerD = applyKasDiscount(rawPowerKas, kasDiscountPct);

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
    redeemGridPreview: refine * 100,
    redeemKrexPreview: refine * 10,
    kasPerRecharge: kasRecharge,
    kasPerRechargeDiscounted: kasRechargeD,
    kasPerCycleOperatingUpper: kasRechargeD,
    plantUpgradeKas: upgradeKas,
    plantUpgradeKasDiscounted: upgradeKasD,
    powerInstallKasEstimate: rawPowerKas,
    powerInstallKasDiscounted: powerD,
    slotUnlockKas: MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
    slotExpandKas: MINECORE_DEFAULT_NEXT_SLOT_COST_KAS,
    diamondsPerHourOnePlant: dPerHour,
    diamondsPerHourAllPlants: dPerHour * n,
    refinementPointsPerHourAllPlants: (dPerHour * n) * MINECORE_REFINE_RATE,
  };
}
