import type {
  IngredientBag,
  MinecoreBatteryId,
  MinecoreBoostId,
  MinecoreMachineId,
  MinecoreModuleId,
  MinecorePowerNodeId,
  MinecoreWorkerId,
  PlantType,
} from './types';

export const MINECORE_STORAGE_PREFIX = 'minecore-state';

export const MINECORE_DEFAULT_PLANT_SLOTS = 4;
export const MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS = 2;
export const MINECORE_DEFAULT_NEXT_SLOT_COST_KAS = 50;

/** 24h window for diamonds/day and cycle scaling. */
export const MINECORE_DAY_MS = 24 * 60 * 60 * 1000;

/** Upgrade modal / calculator tier order (low → apex). */
export const MINECORE_PLANT_TYPE_ORDER: readonly PlantType[] = [
  'standard',
  'plus',
  'premium',
  'advanced',
  'industrial',
  'elite',
  'dominion',
];

/** Base diamond output per 24h from plant infrastructure (rolling daily cap baseline). */
export const MINECORE_PLANT_BASE_DIAMONDS_PER_24H: Record<PlantType, number> = {
  standard: 100,
  plus: 165,
  premium: 250,
  advanced: 500,
  industrial: 720,
  elite: 980,
  dominion: 1_400,
};

/**
 * Max rolling 24h cap by plant (machines/workers cannot push effective output past this). Higher plants allow bigger rigs.
 */
export const MINECORE_PLANT_MAX_DIAMONDS_PER_24H: Record<PlantType, number> = {
  standard: 1_000,
  plus: 1_350,
  premium: 2_500,
  advanced: 10_000,
  industrial: 16_000,
  elite: 24_000,
  dominion: 40_000,
};

/** Base reserve power units for plant tier (facility capacity; shown on cards). */
export const MINECORE_PLANT_BASE_POWER_UNITS: Record<PlantType, number> = {
  standard: 1,
  plus: 1,
  premium: 2,
  advanced: 4,
  industrial: 4,
  elite: 5,
  dominion: 6,
};

/**
 * Crew positions on each plant (distinct Workers-tab NFT links).
 * Higher tiers support more staffed Crew-tab rows.
 */
export const MINECORE_PLANT_WORKFORCE_CAPACITY: Record<PlantType, number> = {
  standard: 1,
  plus: 2,
  premium: 2,
  advanced: 3,
  industrial: 4,
  elite: 5,
  dominion: 6,
};

export function miningWorkerNftSlotsRequired(plantType: PlantType): number {
  const n = MINECORE_PLANT_WORKFORCE_CAPACITY[plantType];
  return Math.max(1, Math.floor(Number.isFinite(n) ? n : 1));
}

/** kW display scale: production/consumption derived from grid + draw factors. */
export const MINECORE_KW_SCALE = 4;

/** Extra grid draw per installed battery pack (kW); scaled by each battery’s {@link BatteryConfig.powerDrawMultiplier}. */
export const MINECORE_BATTERY_GRID_DRAW_BASE_KW = 0.12;

/** Default grid draw when a module omits {@link ModuleConfig.gridConsumptionKw}. */
export const MINECORE_MODULE_DEFAULT_GRID_DRAW_KW = 0.055;

export const MINECORE_PLANT_BASE_PRODUCTION_KW: Record<PlantType, number> = {
  standard: 6,
  plus: 10,
  premium: 14,
  advanced: 28,
  industrial: 36,
  elite: 44,
  dominion: 56,
};

/** Below this efficiency %, a new mining cycle cannot start (`InsufficientPower`). */
export const MINECORE_MIN_MINING_EFFICIENCY_PCT = 12;

/** Load = consumption / max plant power (see `computePlantPowerLoadRatio`). Above this threshold mining stops. */
export const MINECORE_POWER_CRITICAL_LOAD = 0.75;

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

/**
 * Partner-branded collections (Minecore global perks). Add slug strings as collections launch.
 * KREXPRIME / PIXELKREX use dedicated tier ladders in code - do not duplicate here.
 */
export const MINECORE_PARTNER_COLLECTIONS: readonly string[] = [];

/** Premium collections (+100 cap / +10 min per NFT). Listed collections only; unknown collections use Standard baseline (+10/+5). */
export const MINECORE_PREMIUM_COLLECTIONS: readonly string[] = [];

export const MINECORE_DISPLAY_POOL_KREX_REMAINING = (() => {
  const raw = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_MINECORE_POOL_KREX;
  const n = raw != null && raw !== '' ? Number(String(raw).replace(/_/g, '')) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 250_000;
})();

/** KAS cost for the combined plant recharge: +1 reserve unit and full battery (KREX discount at call site). */
export const MINECORE_BATTERY_REFILL_COST_KAS = 2.5;
export const MINECORE_PLANT_RECHARGE_COST_KAS = MINECORE_BATTERY_REFILL_COST_KAS;

/**
 * L1 KREX per 1 KAS for Minecore shop/recharge (treasury transfers peg list KAS via tier discount, then × this rate).
 */
export const MINECORE_KREX_PER_KAS = 7706;

export function minecoreKrexFromDiscountedKas(discountedKas: number): number {
  if (!Number.isFinite(discountedKas) || discountedKas <= 0) return 0;
  return discountedKas * MINECORE_KREX_PER_KAS;
}

/** KAS repair action - resets maintenance wear clock. */
export const MINECORE_PLANT_REPAIR_KAS = 1.5;

/** Shop list price per Stability Patch (consumable for early maintenance service). */
export const MINECORE_STABILITY_PATCH_LIST_KAS = 2;

/** Nominal wall time until efficiency wears to zero without service (~2.5 days before tier/mult). */
export const MINECORE_MAINTENANCE_PERIOD_MS = 2.5 * 24 * 60 * 60 * 1000;

/**
 * Wear ratio (0–1) at which a Stability Patch allows paid service before the plant hits full maintenance lockup.
 * See `apply-event` Repair + PlantSlotCard maintenance modal.
 */
export const MINECORE_MAINTENANCE_EARLY_REPAIR_WEAR = 0.42;

/** Extends maintenance interval (higher plant tier = longer efficient runtime). */
export const MINECORE_PLANT_MAINTENANCE_MULT: Record<PlantType, number> = {
  standard: 1,
  plus: 1.06,
  premium: 1.12,
  advanced: 1.28,
  industrial: 1.36,
  elite: 1.44,
  dominion: 1.55,
};

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
      'https://static.wixstatic.com/media/de4185_20f6148d91ca410ba4e3ec8dae8784e7~mv2.png',
  },
  plus: {
    type: 'plus',
    label: 'Plus Facility',
    costKas: 28,
    icon: 'Layers',
    description: 'Expanded crew links and a module slot without multi-pillar batteries.',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_ae1d39ec88fa4a089aaa35d250576a60~mv2.jpg',
  },
  premium: {
    type: 'premium',
    label: 'Premium Plant',
    costKas: 50,
    icon: 'ShieldCheck',
    description: 'Upgraded infrastructure. Dual battery pillars and fabrication modules.',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_5ea48177c9034a89ba58e44c60c15c51~mv2.png',
  },
  advanced: {
    type: 'advanced',
    label: 'Advanced Complex',
    costKas: 250,
    icon: 'Zap',
    description: 'Industrial-scale mining. High rolling caps and four module slots.',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_da16975f19d8437195ef88d1915cde44~mv2.png',
  },
  industrial: {
    type: 'industrial',
    label: 'Industrial Site',
    costKas: 650,
    icon: 'Building2',
    description: 'Heavy-duty grid headroom, four staffed crew links, and deeper daily ceilings.',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_6df3ca1ce59c46c888649690e4244ddd~mv2.jpg',
  },
  elite: {
    type: 'elite',
    label: 'Elite Foundry',
    costKas: 1_400,
    icon: 'Crown',
    description: 'Five reactor pillars and apex-tier rolling caps for dedicated operators.',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_85049789ce0744feafe794224de71eef~mv2.jpg',
  },
  dominion: {
    type: 'dominion',
    label: 'Dominion Complex',
    costKas: 3_500,
    icon: 'Landmark',
    description: 'Maximum facility scale — six pillars, six crew rows, eight module slots.',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_c8728dbcdd12453aa9add461ff121f8a~mv2.jpg',
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
   * kW consumption curve for grid efficiency only (does not shorten battery runtime).
   */
  powerConsumptionFactor: number;
  /**
   * Multiplier on diamond accrual rate (≥ 1). Battery drain is nominal; speed differentiates rigs.
   */
  miningSpeedMultiplier: number;
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
      'https://static.wixstatic.com/media/de4185_9a8e9e0f9a4b47028dad8d18153896b4~mv2.jpg',
    durationMs: 10 * 60_000,
    baseOutput: 50,
    powerConsumptionFactor: 1.55,
    miningSpeedMultiplier: 1.06,
    powerGridContribution: 1,
    powerBudgetMultiplier: 1.0,
    diamondsPer24h: 50,
  },
  'crystal-extractor': {
    id: 'crystal-extractor',
    label: 'Crystal Extractor',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_a1ee1760488e4edb958a9fbd3a490c39~mv2.png',
    durationMs: 30 * 60_000,
    baseOutput: 180,
    powerConsumptionFactor: 2.45,
    miningSpeedMultiplier: 1.18,
    powerGridContribution: 2,
    powerBudgetMultiplier: 1.0,
    diamondsPer24h: 200,
  },
  'deep-vein-rig': {
    id: 'deep-vein-rig',
    label: 'Deep Vein Rig',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_6db526b602914e9d811af87e66ac35d4~mv2.png',
    durationMs: 60 * 60_000,
    baseOutput: 420,
    powerConsumptionFactor: 4.15,
    miningSpeedMultiplier: 1.28,
    powerGridContribution: 2,
    powerBudgetMultiplier: 1.04,
    diamondsPer24h: 450,
  },
  'quantum-fracturer': {
    id: 'quantum-fracturer',
    label: 'Quantum Fracturer',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_f4994f6c36084bba859d88d0108d7bb0~mv2.png',
    durationMs: 6 * 60 * 60_000,
    baseOutput: 3200,
    additionalCrewRequired: 1,
    powerConsumptionFactor: 10,
    miningSpeedMultiplier: 2.5,
    powerGridContribution: 3,
    powerBudgetMultiplier: 1.1,
    diamondsPer24h: 1200,
  },
  'magma-tap': {
    id: 'magma-tap',
    label: 'Magma Tap',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_e29760261c8c4a2ab82a56c6419f1274~mv2.png',
    durationMs: 18 * 60_000,
    baseOutput: 320,
    powerConsumptionFactor: 2.95,
    miningSpeedMultiplier: 1.15,
    powerGridContribution: 2,
    powerBudgetMultiplier: 1.06,
    diamondsPer24h: 350,
  },
  'orbit-siphon': {
    id: 'orbit-siphon',
    label: 'Orbit Siphon',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_306e9f3f5a774a78aa8c71a6a8fd0e1f~mv2.jpg',
    durationMs: 90 * 60_000,
    baseOutput: 950,
    powerConsumptionFactor: 5.35,
    miningSpeedMultiplier: 1.36,
    powerGridContribution: 4,
    powerBudgetMultiplier: 1.14,
    diamondsPer24h: 700,
  },
};

/** Fabricated operator slots this rig expects (1 base + optional machine.additionalCrewRequired design slots). */
export function fabricatedOperatorSlotsCapacity(machineId: MinecoreMachineId | null): number {
  if (!machineId) return 1;
  const m = MINECORE_MACHINES[machineId];
  return Math.max(1, 1 + (m.additionalCrewRequired ?? 0));
}

export type BatteryConfig = {
  id: MinecoreBatteryId;
  label: string;
  /** Build tab / catalog art (external URL). */
  featuredImageUrl?: string;
  efficiency: number;
  /**
   * V1: reserve count comes from the plant only; keep 0 so batteries do not add power-unit capacity.
   * @deprecated for cap math - use {@link MINECORE_PLANT_BASE_POWER_UNITS}
   */
  powerCapacity: number;
  /** Nominal milliseconds of stored charge when the slot is full (runtime tracks charge 1:1). */
  chargeCapacityMs: number;
  /** Scales {@link MINECORE_BATTERY_GRID_DRAW_BASE_KW} for grid consumption load (larger packs draw more). */
  powerDrawMultiplier?: number;
};

export type PowerNodeConfig = {
  id: MinecorePowerNodeId;
  /** Display name; UI: “Reactors”. */
  label: string;
  featuredImageUrl?: string;
  /** Adds this many kW to plant max power (same units as tier base + rig bus). */
  maxPowerKw: number;
};

export const MINECORE_POWER_NODES: Record<MinecorePowerNodeId, PowerNodeConfig> = {
  'flux-node': {
    id: 'flux-node',
    label: 'Arc Reactor',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_bc4836603d17459a947c573a8ff52a87~mv2.jpg',
    maxPowerKw: 6,
  },
  'lattice-node': {
    id: 'lattice-node',
    label: 'Neon Reactor',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_8b8192a064ca4e7bad388fd171697625~mv2.jpg',
    maxPowerKw: 12,
  },
  'core-node': {
    id: 'core-node',
    label: 'Nexus Reactor',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_ccb909265e76479e996bde0ff9d6d5a4~mv2.jpg',
    maxPowerKw: 20,
  },
  'prismatic-reactor': {
    id: 'prismatic-reactor',
    label: 'Prismatic Reactor',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_9c74c1fedbad4ab3861f7134f804de96~mv2.jpg',
    maxPowerKw: 26,
  },
  'stellar-forge-reactor': {
    id: 'stellar-forge-reactor',
    label: 'Stellar Forge Reactor',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_9bcd83657edd4a3dad6a456186e8bc41~mv2.jpg',
    maxPowerKw: 34,
  },
};

export const MINECORE_BATTERIES: Record<MinecoreBatteryId, BatteryConfig> = {
  'energy-cell': {
    id: 'energy-cell',
    label: 'Energy Cell',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_14d1f9e64e7142208d4affcb2dc0e2db~mv2.jpg',
    efficiency: 1.0,
    powerCapacity: 0,
    chargeCapacityMs: 10 * 60_000,
    powerDrawMultiplier: 1.0,
  },
  'battery-pack': {
    id: 'battery-pack',
    label: 'Battery Pack',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_eb1d0e77aa1848a2bae9105cc3909d1d~mv2.jpg',
    efficiency: 1.15,
    powerCapacity: 0,
    chargeCapacityMs: 60 * 60_000,
    powerDrawMultiplier: 1.06,
  },
  'diamond-capacitor': {
    id: 'diamond-capacitor',
    label: 'Diamond Capacitor',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_737459b7146d40dc85e5a4984d49fd91~mv2.jpg',
    efficiency: 1.3,
    powerCapacity: 0,
    chargeCapacityMs: 120 * 60_000,
    powerDrawMultiplier: 1.1,
  },
  'grid-battery': {
    id: 'grid-battery',
    label: 'Grid Battery',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_caf93d8b16e4402583d5f74ea216312b~mv2.png',
    efficiency: 1.5,
    powerCapacity: 0,
    chargeCapacityMs: 360 * 60_000,
    powerDrawMultiplier: 1.14,
  },
  'flux-array': {
    id: 'flux-array',
    label: 'Flux Array',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_c81fd0cc2e3d4619950395a6e1cc8749~mv2.jpg',
    efficiency: 1.12,
    powerCapacity: 0,
    chargeCapacityMs: 45 * 60_000,
    powerDrawMultiplier: 1.08,
  },
  'void-core-cell': {
    id: 'void-core-cell',
    label: 'Void Core Cell',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_dfb3307700134acd88b4ceb291e2e941~mv2.jpg',
    efficiency: 1.35,
    powerCapacity: 0,
    chargeCapacityMs: 240 * 60_000,
    powerDrawMultiplier: 1.16,
  },
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
   * When true (and Crew “Auto-restart” is on), finished cycles can chain automatically for plants that have this module.
   */
  autoRestartMining?: boolean;
  /** Legacy field; mining bonus moved to {@link diamondsPer24hFlat}. Kept 0 for migrated modules. */
  outputBonus: number;
  /** Flat diamonds / 24h added to this plant’s rolling cap ceiling (non-standard plants with module slots). */
  diamondsPer24hFlat?: number;
  failureReduction: number;
  /** Cooling: reduces consumption kW fraction (0–1). */
  consumptionReduction?: number;
  /** Automation: lengthens cycle duration by this fraction. */
  cycleDurationBonus?: number;
  /** Stability: +efficiency floor under deficit (percentage points). */
  efficiencyFloorBonus?: number;
  /** Refining: +fraction to refinement points from this plant’s worker context (applied globally at refine). */
  refineBonus?: number;
  /** Added to plant grid consumption (kW); cooling modules apply their reduction after additive draws. */
  gridConsumptionKw?: number;
  /** Build-tab blueprint card art (optional). */
  featuredImageUrl?: string;
};

export const MINECORE_MODULES: Record<MinecoreModuleId, ModuleConfig> = {
  'cooling-module': {
    id: 'cooling-module',
    label: 'Cooling Module',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_0830e63d896947688953c577d63e4e61~mv2.jpg',
    kind: 'cooling',
    outputBonus: 0,
    failureReduction: 0.05,
    consumptionReduction: 0.12,
    gridConsumptionKw: 0.04,
  },
  'stability-module': {
    id: 'stability-module',
    label: 'Stability Module',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_b3ae772a574b41568fb8ae0695363981~mv2.jpg',
    kind: 'stability',
    outputBonus: 0,
    failureReduction: 0.08,
    efficiencyFloorBonus: 10,
    gridConsumptionKw: 0.06,
  },
  'aria-sensor': {
    id: 'aria-sensor',
    label: 'ARIA Sensor',
    kind: 'output',
    outputBonus: 0,
    diamondsPer24hFlat: 35,
    failureReduction: 0.06,
    gridConsumptionKw: 0.07,
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_5336df32b6614a288973c5081e9c2bb6~mv2.jpg',
  },
  'vector-drill-chip': {
    id: 'vector-drill-chip',
    label: 'Vector Drill Chip',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_4a53fb6e829342a9ac78aeb9e7e93050~mv2.png',
    kind: 'output',
    outputBonus: 0,
    diamondsPer24hFlat: 45,
    failureReduction: 0.04,
    gridConsumptionKw: 0.08,
  },
  'regen-coil': {
    id: 'regen-coil',
    label: 'Regen Coil',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_adf72f1b62ae480eabd844d56fd2b485~mv2.jpg',
    kind: 'automation',
    autoRestartMining: true,
    outputBonus: 0,
    diamondsPer24hFlat: 18,
    failureReduction: 0.03,
    cycleDurationBonus: 0.1,
    gridConsumptionKw: 0.055,
  },
  'hash-buffer': {
    id: 'hash-buffer',
    label: 'Hash Buffer',
    featuredImageUrl:
      'https://static.wixstatic.com/media/de4185_32a45bad3d5c45bc806c3c7f69f378b6~mv2.jpg',
    kind: 'refining',
    outputBonus: 0,
    failureReduction: 0.1,
    refineBonus: 0.08,
    gridConsumptionKw: 0.06,
  },
  'krex-boost': {
    id: 'krex-boost',
    label: 'KREX Boost',
    kind: 'output',
    outputBonus: 0,
    failureReduction: 0,
    gridConsumptionKw: 0.1,
  },
};

/** Max module slots per plant tier (standard = modules disabled in UI; enforced in reducer). */
export const MINECORE_MAX_MODULES_BY_PLANT: Record<PlantType, number> = {
  standard: 0,
  plus: 1,
  premium: 2,
  advanced: 4,
  industrial: 5,
  elite: 6,
  dominion: 8,
};

export type BoostConfig = { id: MinecoreBoostId; label: string; multiplier: number };
export const MINECORE_BOOSTS: Record<MinecoreBoostId, BoostConfig> = {
  none:              { id: 'none',              label: 'No boost',        multiplier: 1.0 },
  /** Legacy setup field; live yield uses the `krex-boost` module + timer instead. */
  'krex-boost':      { id: 'krex-boost',        label: 'KREX Boost',      multiplier: 2.5 },
  'kas-overclock':   { id: 'kas-overclock',     label: 'KAS Overclock',   multiplier: 1.0 },
  'grid-efficiency': { id: 'grid-efficiency',   label: 'GRID Efficiency', multiplier: 1.2 },
};

/** Shop: one charge is one module inventory unit; equip in a module slot to start the timer. */
export const MINECORE_KREX_BOOST_SHOP_KAS = 25;
export const MINECORE_KREX_BOOST_YIELD_MULT = 2.5;
export const MINECORE_KREX_BOOST_DURATION_MS = 60 * 60 * 1000;

export const MINECORE_KAS_OVERCLOCK_SHOP_KAS = 10;
export const MINECORE_KAS_OVERCLOCK_DAILY_CAP_FLAT = 100;
export const MINECORE_KAS_OVERCLOCK_NEXT_CYCLE_FLAT = 100;
export const MINECORE_KAS_OVERCLOCK_BONUS_WINDOW_MS = MINECORE_DAY_MS;

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
  helixStabilizers: 0,
  plasmaConduits: 0,
  quantumAttuners: 0,
  voidglassFilaments: 0,
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
    'krex-boost': 0,
  },
  nodes: {
    'flux-node': 0,
    'lattice-node': 0,
    'core-node': 0,
    'prismatic-reactor': 0,
    'stellar-forge-reactor': 0,
  },
} as const;

export type RecipeId = string;

export type Recipe = {
  id: RecipeId;
  title: string;
  kind: 'machine' | 'battery' | 'module' | 'powerNode';
  outputId: MinecoreMachineId | MinecoreBatteryId | MinecoreModuleId | MinecorePowerNodeId;
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
  {
    id: 'flux-node',
    title: 'Arc Reactor',
    kind: 'powerNode',
    outputId: 'flux-node',
    requires: { circuitMesh: 6, energyCells: 3, fluxCoils: 2, plasmaConduits: 1 },
  },
  {
    id: 'lattice-node',
    title: 'Neon Reactor',
    kind: 'powerNode',
    outputId: 'lattice-node',
    requires: { alloyPlates: 12, latticeWire: 6, fluxCoils: 5, coreShards: 1, helixStabilizers: 2 },
  },
  {
    id: 'core-node',
    title: 'Nexus Reactor',
    kind: 'powerNode',
    outputId: 'core-node',
    requires: { latticeWire: 10, nullFragments: 1, coreShards: 3, fluxCoils: 8, quantumAttuners: 2 },
  },
  {
    id: 'prismatic-reactor',
    title: 'Prismatic Reactor',
    kind: 'powerNode',
    outputId: 'prismatic-reactor',
    requires: {
      latticeWire: 8,
      helixStabilizers: 6,
      plasmaConduits: 4,
      fluxCoils: 6,
      crystalDust: 30,
    },
  },
  {
    id: 'stellar-forge-reactor',
    title: 'Stellar Forge Reactor',
    kind: 'powerNode',
    outputId: 'stellar-forge-reactor',
    requires: {
      quantumAttuners: 5,
      voidglassFilaments: 4,
      coreShards: 4,
      nullFragments: 2,
      helixStabilizers: 10,
    },
  },
];
