import type {
  IngredientBag,
  MinecoreBatteryId,
  MinecoreBoostId,
  MinecoreMachineId,
  MinecoreModuleId,
  MinecoreWorkerId,
  PlantType,
} from './types';

export const MINECORE_STORAGE_PREFIX = 'minecore-state';

export const MINECORE_DEFAULT_PLANT_SLOTS = 4;
export const MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS = 2;
export const MINECORE_DEFAULT_NEXT_SLOT_COST_KAS = 50;

/** 24h window for diamonds/day and cycle scaling. */
export const MINECORE_DAY_MS = 24 * 60 * 60 * 1000;

/** Base diamond output per 24h from plant infrastructure (rolling daily cap baseline). */
export const MINECORE_PLANT_BASE_DIAMONDS_PER_24H: Record<PlantType, number> = {
  standard: 100,
  premium: 250,
  advanced: 500,
};

/**
 * Max rolling 24h cap by plant (machines/workers cannot push effective output past this). Higher plants allow bigger rigs.
 */
export const MINECORE_PLANT_MAX_DIAMONDS_PER_24H: Record<PlantType, number> = {
  standard: 1_000,
  premium: 2_500,
  advanced: 10_000,
};

/** Base reserve power units for plant tier (facility capacity; shown on cards). */
export const MINECORE_PLANT_BASE_POWER_UNITS: Record<PlantType, number> = {
  standard: 1,
  premium: 2,
  advanced: 4,
};

/** Workforce slots shown on plant setup (assigned crew / capacity). */
export const MINECORE_PLANT_WORKFORCE_CAPACITY: Record<PlantType, number> = {
  standard: 1,
  premium: 3,
  advanced: 5,
};

/** kW display scale: production/consumption derived from grid + draw factors. */
export const MINECORE_KW_SCALE = 4;

export const MINECORE_PLANT_BASE_PRODUCTION_KW: Record<PlantType, number> = {
  standard: 6,
  premium: 14,
  advanced: 28,
};

/** Below this efficiency %, a new mining cycle cannot start (`InsufficientPower`). */
export const MINECORE_MIN_MINING_EFFICIENCY_PCT = 12;

/** Large deficit: efficiency treated as 0 for mining. */
export const MINECORE_POWER_CRITICAL_RATIO = 0.45;

/** Refinement: points per diamond before module bonuses. */
export const MINECORE_REFINE_POINTS_PER_DIAMOND = 1;
/** @deprecated Use MINECORE_REFINE_POINTS_PER_DIAMOND */
export const MINECORE_REFINE_RATE = MINECORE_REFINE_POINTS_PER_DIAMOND;

/** Redeem: tokens per refinement point (single source of truth for UI + logic). */
export const MINECORE_GRID_PER_REFINEMENT_POINT = 10;
export const MINECORE_KREX_PER_REFINEMENT_POINT = 5;
/** @deprecated Use MINECORE_GRID_PER_REFINEMENT_POINT */
export const MINECORE_GRID_REDEEM_RATE = MINECORE_GRID_PER_REFINEMENT_POINT;

/** Daily refinement points that can be redeemed per token (client honest mode). */
export const MINECORE_DAILY_GRID_POINTS_CAP = 5_000;
export const MINECORE_DAILY_KREX_POINTS_CAP = 2_000;

/**
 * Display-only “pool remaining” for Redeem UI until server authority exists.
 * Override via env in deployment.
 */
export const MINECORE_DISPLAY_POOL_GRID_REMAINING = (() => {
  const raw = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_MINECORE_POOL_GRID;
  const n = raw != null && raw !== '' ? Number(String(raw).replace(/_/g, '')) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 1_000_000;
})();

export const MINECORE_DISPLAY_POOL_KREX_REMAINING = (() => {
  const raw = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_MINECORE_POOL_KREX;
  const n = raw != null && raw !== '' ? Number(String(raw).replace(/_/g, '')) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 250_000;
})();

/** KAS cost for the combined plant recharge: +1 reserve unit and full battery (KREX discount at call site). */
export const MINECORE_BATTERY_REFILL_COST_KAS = 2.5;
export const MINECORE_PLANT_RECHARGE_COST_KAS = MINECORE_BATTERY_REFILL_COST_KAS;

/** KAS repair action on a damaged plant (Mining tab). */
export const MINECORE_PLANT_REPAIR_KAS = 5;

export type PlantPreset = {
  type: PlantType;
  label: string;
  costKas: number;
  icon: string;
  description: string;
  /** Featured art for plant cards / UI (external URL). */
  featuredImageUrl?: string;
};

export const MINECORE_PLANT_PRESETS: Record<PlantType, PlantPreset> = {
  standard: {
    type: 'standard',
    label: 'Standard Plant',
    costKas: 0,
    icon: 'Hammer',
    description: 'Basic mining operations. Affordable and reliable.',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_b8a957fa04784a2285b453e67bd65b7a~mv2.jpg',
  },
  premium: {
    type: 'premium',
    label: 'Premium Plant',
    costKas: 50,
    icon: 'ShieldCheck',
    description: 'Upgraded infrastructure. Supports higher-tier machines.',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_3f7117b4be45439db81250ad591bfb09~mv2.jpg',
  },
  advanced: {
    type: 'advanced',
    label: 'Advanced Complex',
    costKas: 250,
    icon: 'Zap',
    description: 'Industrial-scale mining. Unlocks maximum output and specialized rigs.',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_f6f25f1e8e734eeda6aca8bb1622e57b~mv2.jpg',
  },
};

export type MachineConfig = {
  id: MinecoreMachineId;
  label: string;
  /** Build tab / catalog art (external URL). */
  featuredImageUrl?: string;
  durationMs: number;
  baseOutput: number;
  /**
   * Extra crew slots this rig expects beyond the plant’s single operator (0 = none).
   * Shown on fabrication cards; future logic can enforce minimum crew.
   */
  additionalCrewRequired?: number;
  /**
   * How fast this machine drains battery charge.
   * 1.0 = baseline (Pulse Drill).
   */
  powerConsumptionFactor: number;
  /**
   * kW production contribution to the plant bus (display; reserve unit count is plant-tier only in V1).
   */
  powerGridContribution: number;
  /**
   * Multiplier on the battery’s effective charge budget (machine conditions power delivery to the cell).
   */
  powerBudgetMultiplier: number;
  /**
   * Flat diamonds/24h added to the plant rolling cap (V1: plant base + this + worker flat, before boost & battery mult).
   */
  diamondsPer24h: number;
};

export const MINECORE_MACHINES: Record<MinecoreMachineId, MachineConfig> = {
  'pulse-drill': {
    id: 'pulse-drill',
    label: 'Pulse Drill',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_772173d870a0427d8ad8942004d7933b~mv2.jpg',
    durationMs: 10 * 60_000,
    baseOutput: 50,
    powerConsumptionFactor: 1.0,
    powerGridContribution: 1,
    powerBudgetMultiplier: 1.0,
    diamondsPer24h: 50,
  },
  'crystal-extractor': {
    id: 'crystal-extractor',
    label: 'Crystal Extractor',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_8e87fe8e88e14bfa87be41e55404f1ae~mv2.jpg',
    durationMs: 30 * 60_000,
    baseOutput: 180,
    powerConsumptionFactor: 1.5,
    powerGridContribution: 2,
    powerBudgetMultiplier: 1.0,
    diamondsPer24h: 200,
  },
  'deep-vein-rig': {
    id: 'deep-vein-rig',
    label: 'Deep Vein Rig',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_94e88ca725894d308f61d46025e21a5f~mv2.jpg',
    durationMs: 60 * 60_000,
    baseOutput: 420,
    powerConsumptionFactor: 2.5,
    powerGridContribution: 2,
    powerBudgetMultiplier: 1.04,
    diamondsPer24h: 450,
  },
  'quantum-fracturer': {
    id: 'quantum-fracturer',
    label: 'Quantum Fracturer',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_cdbc21d0648249749f9ea46cbca80d71~mv2.jpg',
    durationMs: 6 * 60 * 60_000,
    baseOutput: 3200,
    powerConsumptionFactor: 6.0,
    powerGridContribution: 3,
    powerBudgetMultiplier: 1.1,
    diamondsPer24h: 1200,
  },
  'magma-tap': {
    id: 'magma-tap',
    label: 'Magma Tap',
    durationMs: 18 * 60_000,
    baseOutput: 320,
    powerConsumptionFactor: 1.8,
    powerGridContribution: 2,
    powerBudgetMultiplier: 1.06,
    diamondsPer24h: 350,
  },
  'orbit-siphon': {
    id: 'orbit-siphon',
    label: 'Orbit Siphon',
    durationMs: 90 * 60_000,
    baseOutput: 950,
    powerConsumptionFactor: 3.2,
    powerGridContribution: 4,
    powerBudgetMultiplier: 1.14,
    diamondsPer24h: 700,
  },
};

export type BatteryConfig = {
  id: MinecoreBatteryId;
  label: string;
  /** Build tab / catalog art (external URL). */
  featuredImageUrl?: string;
  efficiency: number;
  /**
   * V1: reserve count comes from the plant only; keep 0 so batteries do not add power-unit capacity.
   * @deprecated for cap math — use {@link MINECORE_PLANT_BASE_POWER_UNITS}
   */
  powerCapacity: number;
  /**
   * How many ms of base charge this battery holds at powerConsumptionFactor = 1.0.
   * Actual runtime = chargeCapacityMs / machine.powerConsumptionFactor.
   */
  chargeCapacityMs: number;
};

export const MINECORE_BATTERIES: Record<MinecoreBatteryId, BatteryConfig> = {
  'energy-cell': {
    id: 'energy-cell',
    label: 'Energy Cell',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_566df01398ff40738aeeab280c3cd03e~mv2.jpg',
    efficiency: 1.0,
    powerCapacity: 0,
    chargeCapacityMs: 10 * 60_000,
  },
  'battery-pack': {
    id: 'battery-pack',
    label: 'Battery Pack',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_db5ee3ec937e40fa973ac04124553609~mv2.jpg',
    efficiency: 1.15,
    powerCapacity: 0,
    chargeCapacityMs: 60 * 60_000,
  },
  'diamond-capacitor': {
    id: 'diamond-capacitor',
    label: 'Diamond Capacitor',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_2745d6b902274187b11a8f07356c0c92~mv2.jpg',
    efficiency: 1.3,
    powerCapacity: 0,
    chargeCapacityMs: 120 * 60_000,
  },
  'grid-battery': { id: 'grid-battery', label: 'Grid Battery', efficiency: 1.5, powerCapacity: 0, chargeCapacityMs: 360 * 60_000 },
  'flux-array': { id: 'flux-array', label: 'Flux Array', efficiency: 1.12, powerCapacity: 0, chargeCapacityMs: 45 * 60_000 },
  'void-core-cell': { id: 'void-core-cell', label: 'Void Core Cell', efficiency: 1.35, powerCapacity: 0, chargeCapacityMs: 240 * 60_000 },
};

export type WorkerConfig = {
  id: MinecoreWorkerId;
  label: string;
  /** @deprecated V1: unused; keep 1 for old saves. */
  multiplier: number;
  /**
   * Flat diamonds/24h added to the plant rolling cap (V1: +10, no % bonuses).
   */
  diamondBonusPer24h: number;
};
export const MINECORE_WORKERS: Record<MinecoreWorkerId, WorkerConfig> = {
  worker: {
    id: 'worker',
    label: 'Worker',
    multiplier: 1,
    diamondBonusPer24h: 10,
  },
  operator: {
    id: 'operator',
    label: 'Operator',
    multiplier: 1,
    diamondBonusPer24h: 10,
  },
};

export type MinecoreModuleKind = 'output' | 'cooling' | 'automation' | 'stability' | 'refining';

export type ModuleConfig = {
  id: MinecoreModuleId;
  label: string;
  kind: MinecoreModuleKind;
  /**
   * When true (and Workers “Auto-restart” is on), finished cycles can chain automatically for plants that have this module.
   */
  autoRestartMining?: boolean;
  /** Output modules: +fraction of (base+machine) per 24h. */
  outputBonus: number;
  failureReduction: number;
  /** Cooling: reduces consumption kW fraction (0–1). */
  consumptionReduction?: number;
  /** Automation: lengthens cycle duration by this fraction. */
  cycleDurationBonus?: number;
  /** Stability: +efficiency floor under deficit (percentage points). */
  efficiencyFloorBonus?: number;
  /** Refining: +fraction to refinement points from this plant’s worker context (applied globally at refine). */
  refineBonus?: number;
};

export const MINECORE_MODULES: Record<MinecoreModuleId, ModuleConfig> = {
  'cooling-module': {
    id: 'cooling-module',
    label: 'Cooling Module',
    kind: 'cooling',
    outputBonus: 0,
    failureReduction: 0.05,
    consumptionReduction: 0.12,
  },
  'stability-module': {
    id: 'stability-module',
    label: 'Stability Module',
    kind: 'stability',
    outputBonus: 0.02,
    failureReduction: 0.08,
    efficiencyFloorBonus: 10,
  },
  'aria-sensor': {
    id: 'aria-sensor',
    label: 'ARIA Sensor',
    kind: 'output',
    outputBonus: 0.06,
    failureReduction: 0.06,
  },
  'vector-drill-chip': {
    id: 'vector-drill-chip',
    label: 'Vector Drill Chip',
    kind: 'output',
    outputBonus: 0.08,
    failureReduction: 0.04,
  },
  'regen-coil': {
    id: 'regen-coil',
    label: 'Regen Coil',
    kind: 'automation',
    autoRestartMining: true,
    outputBonus: 0.03,
    failureReduction: 0.03,
    cycleDurationBonus: 0.1,
  },
  'hash-buffer': {
    id: 'hash-buffer',
    label: 'Hash Buffer',
    kind: 'refining',
    outputBonus: 0,
    failureReduction: 0.1,
    refineBonus: 0.08,
  },
};

/** Max module slots per plant tier (standard = modules disabled in UI; enforced in reducer). */
export const MINECORE_MAX_MODULES_BY_PLANT: Record<PlantType, number> = {
  standard: 0,
  premium: 2,
  advanced: 4,
};

export type BoostConfig = { id: MinecoreBoostId; label: string; multiplier: number };
export const MINECORE_BOOSTS: Record<MinecoreBoostId, BoostConfig> = {
  none:              { id: 'none',              label: 'No boost',        multiplier: 1.0 },
  'krex-boost':      { id: 'krex-boost',        label: 'KREX Boost',      multiplier: 1.5 },
  'kas-overclock':   { id: 'kas-overclock',     label: 'KAS Overclock',   multiplier: 2.0 },
  'grid-efficiency': { id: 'grid-efficiency',   label: 'GRID Efficiency', multiplier: 1.2 },
};

/** New players start with no ingredients; earn via mining/refine/redeem. */
export const MINECORE_STARTER_INGREDIENTS: IngredientBag = {
  crystalDust: 0,
  alloyPlates: 0,
  circuitMesh: 0,
  energyCells: 0,
  coreShards: 0,
  coolingGel: 0,
  ariaChips: 0,
  nullFragments: 0,
  fluxCoils: 0,
  latticeWire: 0,
};

export const MINECORE_STARTER_OWNED = {
  machines: {
    'pulse-drill': 0,
    'crystal-extractor': 0,
    'deep-vein-rig': 0,
    'quantum-fracturer': 0,
    'magma-tap': 0,
    'orbit-siphon': 0,
  },
  batteries: {
    'energy-cell': 0,
    'battery-pack': 0,
    'diamond-capacitor': 0,
    'grid-battery': 0,
    'flux-array': 0,
    'void-core-cell': 0,
  },
  workers: { worker: 0, operator: 0 },
  modules: {
    'cooling-module': 0,
    'stability-module': 0,
    'aria-sensor': 0,
    'vector-drill-chip': 0,
    'regen-coil': 0,
    'hash-buffer': 0,
  },
} as const;

export type RecipeId = string;

export type Recipe = {
  id: RecipeId;
  title: string;
  kind: 'machine' | 'battery' | 'module';
  outputId: MinecoreMachineId | MinecoreBatteryId | MinecoreModuleId;
  requires: Partial<IngredientBag>;
};

export const MINECORE_RECIPES: Recipe[] = [
  { id: 'pulse-drill', title: 'Pulse Drill', kind: 'machine', outputId: 'pulse-drill', requires: { alloyPlates: 10, circuitMesh: 5, energyCells: 2 } },
  {
    id: 'crystal-extractor',
    title: 'Crystal Extractor',
    kind: 'machine',
    outputId: 'crystal-extractor',
    requires: { alloyPlates: 18, circuitMesh: 10, ariaChips: 2, energyCells: 4 },
  },
  {
    id: 'deep-vein-rig',
    title: 'Deep Vein Rig',
    kind: 'machine',
    outputId: 'deep-vein-rig',
    requires: { alloyPlates: 35, circuitMesh: 16, coreShards: 3, energyCells: 6, fluxCoils: 2 },
  },
  {
    id: 'magma-tap',
    title: 'Magma Tap',
    kind: 'machine',
    outputId: 'magma-tap',
    requires: { alloyPlates: 28, circuitMesh: 12, coreShards: 2, coolingGel: 10, fluxCoils: 4 },
  },
  {
    id: 'orbit-siphon',
    title: 'Orbit Siphon',
    kind: 'machine',
    outputId: 'orbit-siphon',
    requires: { alloyPlates: 55, circuitMesh: 22, ariaChips: 6, latticeWire: 8, fluxCoils: 6 },
  },
  {
    id: 'quantum-fracturer',
    title: 'Quantum Fracturer',
    kind: 'machine',
    outputId: 'quantum-fracturer',
    requires: { alloyPlates: 80, circuitMesh: 30, nullFragments: 3, coreShards: 5, fluxCoils: 12, latticeWire: 10 },
  },
  { id: 'energy-cell', title: 'Energy Cell', kind: 'battery', outputId: 'energy-cell', requires: { circuitMesh: 2, energyCells: 1 } },
  {
    id: 'battery-pack',
    title: 'Battery Pack',
    kind: 'battery',
    outputId: 'battery-pack',
    requires: { circuitMesh: 5, energyCells: 3, alloyPlates: 8 },
  },
  {
    id: 'diamond-capacitor',
    title: 'Diamond Capacitor',
    kind: 'battery',
    outputId: 'diamond-capacitor',
    requires: { circuitMesh: 10, energyCells: 5, crystalDust: 50, coreShards: 1 },
  },
  {
    id: 'grid-battery',
    title: 'Grid Battery',
    kind: 'battery',
    outputId: 'grid-battery',
    requires: { circuitMesh: 18, energyCells: 8, alloyPlates: 24, ariaChips: 4 },
  },
  {
    id: 'flux-array',
    title: 'Flux Array',
    kind: 'battery',
    outputId: 'flux-array',
    requires: { fluxCoils: 6, circuitMesh: 8, latticeWire: 4, energyCells: 4 },
  },
  {
    id: 'void-core-cell',
    title: 'Void Core Cell',
    kind: 'battery',
    outputId: 'void-core-cell',
    requires: { nullFragments: 2, fluxCoils: 14, latticeWire: 12, coreShards: 3 },
  },
  { id: 'cooling-module', title: 'Cooling Module', kind: 'module', outputId: 'cooling-module', requires: { coolingGel: 6, alloyPlates: 4 } },
  { id: 'stability-module', title: 'Stability Module', kind: 'module', outputId: 'stability-module', requires: { alloyPlates: 6, circuitMesh: 4 } },
  { id: 'aria-sensor', title: 'ARIA Sensor', kind: 'module', outputId: 'aria-sensor', requires: { ariaChips: 4, circuitMesh: 4 } },
  { id: 'vector-drill-chip', title: 'Vector Drill Chip', kind: 'module', outputId: 'vector-drill-chip', requires: { circuitMesh: 8, nullFragments: 1 } },
  {
    id: 'regen-coil',
    title: 'Regen Coil',
    kind: 'module',
    outputId: 'regen-coil',
    requires: { fluxCoils: 5, coolingGel: 8, circuitMesh: 6 },
  },
  {
    id: 'hash-buffer',
    title: 'Hash Buffer',
    kind: 'module',
    outputId: 'hash-buffer',
    requires: { latticeWire: 6, circuitMesh: 10, crystalDust: 40 },
  },
];
