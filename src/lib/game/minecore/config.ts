import type {
  IngredientBag,
  MinecoreBatteryId,
  MinecoreBoostId,
  MinecoreMachineId,
  MinecoreModuleId,
  MinecorePowerSourceId,
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
   * 1.0 = baseline (Crystal Extractor).
   * 0.5 = half drain (Pulse Drill lasts 2× longer).
   * 2.0 = double drain (Deep Vein Rig depletes battery 2× faster).
   */
  powerConsumptionFactor: number;
};

export const MINECORE_MACHINES: Record<MinecoreMachineId, MachineConfig> = {
  'pulse-drill':        { id: 'pulse-drill',        label: 'Pulse Drill',        durationMs: 10 * 60_000,      baseOutput: 50,   powerConsumptionFactor: 1.0 },
  'crystal-extractor':  { id: 'crystal-extractor',  label: 'Crystal Extractor',  durationMs: 30 * 60_000,      baseOutput: 180,  powerConsumptionFactor: 1.5 },
  'deep-vein-rig':      { id: 'deep-vein-rig',      label: 'Deep Vein Rig',      durationMs: 60 * 60_000,      baseOutput: 420,  powerConsumptionFactor: 2.5 },
  'quantum-fracturer':  { id: 'quantum-fracturer',  label: 'Quantum Fracturer',  durationMs: 6 * 60 * 60_000,  baseOutput: 3200, powerConsumptionFactor: 6.0 },
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
  'energy-cell':        { id: 'energy-cell',        label: 'Energy Cell',        efficiency: 1.0,  powerCapacity: 1, chargeCapacityMs: 30  * 60_000 },
  'battery-pack':       { id: 'battery-pack',       label: 'Battery Pack',       efficiency: 1.15, powerCapacity: 2, chargeCapacityMs: 60  * 60_000 },
  'diamond-capacitor':  { id: 'diamond-capacitor',  label: 'Diamond Capacitor',  efficiency: 1.3,  powerCapacity: 3, chargeCapacityMs: 120 * 60_000 },
  'grid-battery':       { id: 'grid-battery',       label: 'Grid Battery',       efficiency: 1.5,  powerCapacity: 4, chargeCapacityMs: 360 * 60_000 },
};

/** Lore-tied surface power — caps reserve *units* (1 KAS top-up each) and eases (or tightens) battery drain. */
export type PowerSourceConfig = {
  id: MinecorePowerSourceId;
  label: string;
  kind: 'thermal' | 'fission' | 'catalytic' | 'renewable' | 'exotic';
  /** Short in-world blurb; echoes Kaspaland / Chronicles tone. */
  lore: string;
  /** How many reserve power units this source allows (recharged with KAS). */
  maxPowerUnits: number;
  /** Multiplies effective machine draw (1.0 = neutral; below 1 = slower burn, above 1 = faster). */
  drainRateMultiplier: number;
  /** Bonus effective charge in the battery sub-system (1.0 = none). */
  energyBudgetMultiplier: number;
  installRequires: Partial<IngredientBag>;
};

export const MINECORE_POWER_SOURCES: Record<MinecorePowerSourceId, PowerSourceConfig> = {
  'vein-thermal': {
    id: 'vein-thermal',
    label: 'Vein Thermal',
    kind: 'thermal',
    lore: 'Steady heat drawn from mapped BlockDAG strata.',
    maxPowerUnits: 4,
    drainRateMultiplier: 1.05,
    energyBudgetMultiplier: 1.0,
    installRequires: { crystalDust: 40, energyCells: 2, circuitMesh: 2 },
  },
  'fission-bdag': {
    id: 'fission-bdag',
    label: 'DAG Fission',
    kind: 'fission',
    lore: 'Compressed ledger shards for high burst output.',
    maxPowerUnits: 6,
    drainRateMultiplier: 0.92,
    energyBudgetMultiplier: 1.08,
    installRequires: { coreShards: 2, alloyPlates: 12, nullFragments: 1, energyCells: 3 },
  },
  'krex-catalyst': {
    id: 'krex-catalyst',
    kind: 'catalytic',
    label: 'Krex Catalyst',
    lore: 'Keeps reactions steady when the network spikes.',
    maxPowerUnits: 5,
    drainRateMultiplier: 0.88,
    energyBudgetMultiplier: 1.12,
    installRequires: { coolingGel: 8, ariaChips: 3, circuitMesh: 4 },
  },
  'aria-photon': {
    id: 'aria-photon',
    kind: 'renewable',
    label: 'Photon Array',
    lore: 'Soft buffer fill for longer, calmer cycles.',
    maxPowerUnits: 5,
    drainRateMultiplier: 0.85,
    energyBudgetMultiplier: 1.15,
    installRequires: { circuitMesh: 6, energyCells: 2, crystalDust: 30 },
  },
  'null-reactor': {
    id: 'null-reactor',
    kind: 'exotic',
    label: 'Null Reactor',
    lore: 'Exotic ring that deepens battery reserves.',
    maxPowerUnits: 3,
    drainRateMultiplier: 0.8,
    energyBudgetMultiplier: 1.2,
    installRequires: { nullFragments: 2, coreShards: 1, circuitMesh: 8, alloyPlates: 6 },
  },
};

export const MINECORE_POWER_SOURCE_IDS: MinecorePowerSourceId[] = [
  'vein-thermal',
  'fission-bdag',
  'krex-catalyst',
  'aria-photon',
  'null-reactor',
];

export type WorkerConfig = { id: MinecoreWorkerId; label: string; multiplier: number };
export const MINECORE_WORKERS: Record<MinecoreWorkerId, WorkerConfig> = {
  worker:   { id: 'worker',   label: 'Worker',   multiplier: 1.1 },
  operator: { id: 'operator', label: 'Operator', multiplier: 1.5 },
};

export type ModuleConfig = { id: MinecoreModuleId; label: string; outputBonus: number; failureReduction: number };
export const MINECORE_MODULES: Record<MinecoreModuleId, ModuleConfig> = {
  'cooling-module':    { id: 'cooling-module',    label: 'Cooling Module',    outputBonus: 0.05, failureReduction: 0.05 },
  'stability-module':  { id: 'stability-module',  label: 'Stability Module',  outputBonus: 0.04, failureReduction: 0.08 },
  'aria-sensor':       { id: 'aria-sensor',       label: 'ARIA Sensor',       outputBonus: 0.06, failureReduction: 0.06 },
  'vector-drill-chip': { id: 'vector-drill-chip', label: 'Vector Drill Chip', outputBonus: 0.08, failureReduction: 0.04 },
};

export type BoostConfig = { id: MinecoreBoostId; label: string; multiplier: number };
export const MINECORE_BOOSTS: Record<MinecoreBoostId, BoostConfig> = {
  none:              { id: 'none',              label: 'No boost',        multiplier: 1.0 },
  'krex-boost':      { id: 'krex-boost',        label: 'KREX Boost',      multiplier: 1.5 },
  'kas-overclock':   { id: 'kas-overclock',     label: 'KAS Overclock',   multiplier: 2.0 },
  'grid-efficiency': { id: 'grid-efficiency',   label: 'GRID Efficiency', multiplier: 1.2 },
};

export const MINECORE_STARTER_INGREDIENTS: IngredientBag = {
  crystalDust:   200,
  alloyPlates:   60,
  circuitMesh:   40,
  energyCells:   30,
  coreShards:    10,
  coolingGel:    25,
  ariaChips:     15,
  nullFragments: 5,
};

export const MINECORE_STARTER_OWNED = {
  machines:  { 'pulse-drill': 1, 'crystal-extractor': 0, 'deep-vein-rig': 0, 'quantum-fracturer': 0 },
  batteries: { 'energy-cell': 1, 'battery-pack': 0, 'diamond-capacitor': 0, 'grid-battery': 0 },
  workers:   { worker: 1, operator: 0 },
  modules:   { 'cooling-module': 0, 'stability-module': 0, 'aria-sensor': 0, 'vector-drill-chip': 0 },
} as const;

export type RecipeId =
  | 'pulse-drill' | 'crystal-extractor' | 'deep-vein-rig'
  | 'energy-cell' | 'cooling-module' | 'stability-module'
  | 'aria-sensor' | 'vector-drill-chip';

export type Recipe = {
  id: RecipeId;
  title: string;
  kind: 'machine' | 'battery' | 'module';
  outputId: MinecoreMachineId | MinecoreBatteryId | MinecoreModuleId;
  requires: Partial<IngredientBag>;
};

export const MINECORE_RECIPES: Recipe[] = [
  { id: 'pulse-drill',        title: 'Pulse Drill',        kind: 'machine', outputId: 'pulse-drill',        requires: { alloyPlates: 10, circuitMesh: 5, energyCells: 2 } },
  { id: 'crystal-extractor',  title: 'Crystal Extractor',  kind: 'machine', outputId: 'crystal-extractor',  requires: { alloyPlates: 18, circuitMesh: 10, ariaChips: 2, energyCells: 4 } },
  { id: 'deep-vein-rig',      title: 'Deep Vein Rig',      kind: 'machine', outputId: 'deep-vein-rig',      requires: { alloyPlates: 35, circuitMesh: 16, coreShards: 3, energyCells: 6 } },
  { id: 'energy-cell',        title: 'Energy Cell',        kind: 'battery', outputId: 'energy-cell',        requires: { circuitMesh: 2, energyCells: 1 } },
  { id: 'cooling-module',     title: 'Cooling Module',     kind: 'module',  outputId: 'cooling-module',     requires: { coolingGel: 6, alloyPlates: 4 } },
  { id: 'stability-module',   title: 'Stability Module',   kind: 'module',  outputId: 'stability-module',   requires: { alloyPlates: 6, circuitMesh: 4 } },
  { id: 'aria-sensor',        title: 'ARIA Sensor',        kind: 'module',  outputId: 'aria-sensor',        requires: { ariaChips: 4, circuitMesh: 4 } },
  { id: 'vector-drill-chip',  title: 'Vector Drill Chip',  kind: 'module',  outputId: 'vector-drill-chip',  requires: { circuitMesh: 8, nullFragments: 1 } },
];
