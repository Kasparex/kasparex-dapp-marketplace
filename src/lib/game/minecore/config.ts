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
export const MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS = 1;
export const MINECORE_DEFAULT_NEXT_SLOT_COST_KAS = 50;

export const MINECORE_REFINE_RATE = 1; // 1 diamond -> 1 refinement point (V1 placeholder)
export const MINECORE_GRID_REDEEM_RATE = 1; // 1 point -> 1 GRID redeemable (V1 placeholder)

/** KAS cost for the combined plant recharge: +1 reserve unit and full battery (KREX discount at call site). */
export const MINECORE_BATTERY_REFILL_COST_KAS = 2.5;
export const MINECORE_PLANT_RECHARGE_COST_KAS = MINECORE_BATTERY_REFILL_COST_KAS;

export type PlantPreset = {
  type: PlantType;
  label: string;
  costKas: number;
  icon: string;
  description: string;
};

export const MINECORE_PLANT_PRESETS: Record<PlantType, PlantPreset> = {
  standard: {
    type: 'standard',
    label: 'Standard Plant',
    costKas: 0,
    icon: 'Hammer',
    description: 'Basic mining operations. Affordable and reliable.',
  },
  premium: {
    type: 'premium',
    label: 'Premium Plant',
    costKas: 50,
    icon: 'ShieldCheck',
    description: 'Upgraded infrastructure. Supports higher-tier machines.',
  },
  advanced: {
    type: 'advanced',
    label: 'Advanced Complex',
    costKas: 250,
    icon: 'Zap',
    description: 'Industrial-scale mining. Unlocks maximum output and specialized rigs.',
  },
};

export type MachineConfig = {
  id: MinecoreMachineId;
  label: string;
  durationMs: number;
  baseOutput: number;
  /**
   * How fast this machine drains battery charge.
   * 1.0 = baseline (Pulse Drill).
   */
  powerConsumptionFactor: number;
  /**
   * Reserve power units contributed by this rig (summed with the battery’s `powerCapacity` for the plant cap).
   */
  powerGridContribution: number;
  /**
   * Multiplier on the battery’s effective charge budget (machine conditions power delivery to the cell).
   */
  powerBudgetMultiplier: number;
};

export const MINECORE_MACHINES: Record<MinecoreMachineId, MachineConfig> = {
  'pulse-drill': {
    id: 'pulse-drill',
    label: 'Pulse Drill',
    durationMs: 10 * 60_000,
    baseOutput: 50,
    powerConsumptionFactor: 1.0,
    powerGridContribution: 1,
    powerBudgetMultiplier: 1.0,
  },
  'crystal-extractor': {
    id: 'crystal-extractor',
    label: 'Crystal Extractor',
    durationMs: 30 * 60_000,
    baseOutput: 180,
    powerConsumptionFactor: 1.5,
    powerGridContribution: 2,
    powerBudgetMultiplier: 1.0,
  },
  'deep-vein-rig': {
    id: 'deep-vein-rig',
    label: 'Deep Vein Rig',
    durationMs: 60 * 60_000,
    baseOutput: 420,
    powerConsumptionFactor: 2.5,
    powerGridContribution: 2,
    powerBudgetMultiplier: 1.04,
  },
  'quantum-fracturer': {
    id: 'quantum-fracturer',
    label: 'Quantum Fracturer',
    durationMs: 6 * 60 * 60_000,
    baseOutput: 3200,
    powerConsumptionFactor: 6.0,
    powerGridContribution: 3,
    powerBudgetMultiplier: 1.1,
  },
  'magma-tap': {
    id: 'magma-tap',
    label: 'Magma Tap',
    durationMs: 18 * 60_000,
    baseOutput: 320,
    powerConsumptionFactor: 1.8,
    powerGridContribution: 2,
    powerBudgetMultiplier: 1.06,
  },
  'orbit-siphon': {
    id: 'orbit-siphon',
    label: 'Orbit Siphon',
    durationMs: 90 * 60_000,
    baseOutput: 950,
    powerConsumptionFactor: 3.2,
    powerGridContribution: 4,
    powerBudgetMultiplier: 1.14,
  },
};

export type BatteryConfig = {
  id: MinecoreBatteryId;
  label: string;
  efficiency: number;
  powerCapacity: number;
  /**
   * How many ms of base charge this battery holds at powerConsumptionFactor = 1.0.
   * Actual runtime = chargeCapacityMs / machine.powerConsumptionFactor.
   */
  chargeCapacityMs: number;
};

export const MINECORE_BATTERIES: Record<MinecoreBatteryId, BatteryConfig> = {
  'energy-cell': { id: 'energy-cell', label: 'Energy Cell', efficiency: 1.0, powerCapacity: 1, chargeCapacityMs: 30 * 60_000 },
  'battery-pack': { id: 'battery-pack', label: 'Battery Pack', efficiency: 1.15, powerCapacity: 2, chargeCapacityMs: 60 * 60_000 },
  'diamond-capacitor': { id: 'diamond-capacitor', label: 'Diamond Capacitor', efficiency: 1.3, powerCapacity: 3, chargeCapacityMs: 120 * 60_000 },
  'grid-battery': { id: 'grid-battery', label: 'Grid Battery', efficiency: 1.5, powerCapacity: 4, chargeCapacityMs: 360 * 60_000 },
  'flux-array': { id: 'flux-array', label: 'Flux Array', efficiency: 1.12, powerCapacity: 2, chargeCapacityMs: 45 * 60_000 },
  'void-core-cell': { id: 'void-core-cell', label: 'Void Core Cell', efficiency: 1.35, powerCapacity: 5, chargeCapacityMs: 240 * 60_000 },
};

export type WorkerConfig = { id: MinecoreWorkerId; label: string; multiplier: number };
export const MINECORE_WORKERS: Record<MinecoreWorkerId, WorkerConfig> = {
  worker:   { id: 'worker',   label: 'Worker',   multiplier: 1.1 },
  operator: { id: 'operator', label: 'Operator', multiplier: 1.5 },
};

export type ModuleConfig = { id: MinecoreModuleId; label: string; outputBonus: number; failureReduction: number };
export const MINECORE_MODULES: Record<MinecoreModuleId, ModuleConfig> = {
  'cooling-module': { id: 'cooling-module', label: 'Cooling Module', outputBonus: 0.05, failureReduction: 0.05 },
  'stability-module': { id: 'stability-module', label: 'Stability Module', outputBonus: 0.04, failureReduction: 0.08 },
  'aria-sensor': { id: 'aria-sensor', label: 'ARIA Sensor', outputBonus: 0.06, failureReduction: 0.06 },
  'vector-drill-chip': { id: 'vector-drill-chip', label: 'Vector Drill Chip', outputBonus: 0.08, failureReduction: 0.04 },
  'regen-coil': { id: 'regen-coil', label: 'Regen Coil', outputBonus: 0.07, failureReduction: 0.03 },
  'hash-buffer': { id: 'hash-buffer', label: 'Hash Buffer', outputBonus: 0.05, failureReduction: 0.1 },
};

export type BoostConfig = { id: MinecoreBoostId; label: string; multiplier: number };
export const MINECORE_BOOSTS: Record<MinecoreBoostId, BoostConfig> = {
  none:              { id: 'none',              label: 'No boost',        multiplier: 1.0 },
  'krex-boost':      { id: 'krex-boost',        label: 'KREX Boost',      multiplier: 1.5 },
  'kas-overclock':   { id: 'kas-overclock',     label: 'KAS Overclock',   multiplier: 2.0 },
  'grid-efficiency': { id: 'grid-efficiency',   label: 'GRID Efficiency', multiplier: 1.2 },
};

export const MINECORE_STARTER_INGREDIENTS: IngredientBag = {
  crystalDust: 200,
  alloyPlates: 60,
  circuitMesh: 40,
  energyCells: 30,
  coreShards: 10,
  coolingGel: 25,
  ariaChips: 15,
  nullFragments: 5,
  fluxCoils: 20,
  latticeWire: 15,
};

export const MINECORE_STARTER_OWNED = {
  machines: {
    'pulse-drill': 1,
    'crystal-extractor': 0,
    'deep-vein-rig': 0,
    'quantum-fracturer': 0,
    'magma-tap': 0,
    'orbit-siphon': 0,
  },
  batteries: {
    'energy-cell': 1,
    'battery-pack': 0,
    'diamond-capacitor': 0,
    'grid-battery': 0,
    'flux-array': 0,
    'void-core-cell': 0,
  },
  workers: { worker: 1, operator: 0 },
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
