export type MinecoreIngredient =
  | 'crystalDust'
  | 'alloyPlates'
  | 'circuitMesh'
  | 'energyCells'
  | 'coreShards'
  | 'coolingGel'
  | 'ariaChips'
  | 'nullFragments';

export const MINECORE_INGREDIENT_KEYS: MinecoreIngredient[] = [
  'crystalDust',
  'alloyPlates',
  'circuitMesh',
  'energyCells',
  'coreShards',
  'coolingGel',
  'ariaChips',
  'nullFragments',
];

export type MinecoreMachineId = 'pulse-drill' | 'crystal-extractor' | 'deep-vein-rig' | 'quantum-fracturer';
export type MinecoreBatteryId = 'energy-cell' | 'battery-pack' | 'diamond-capacitor' | 'grid-battery';
export type MinecoreWorkerId = 'worker' | 'operator';
export type MinecoreModuleId = 'cooling-module' | 'stability-module' | 'aria-sensor' | 'vector-drill-chip';
export type MinecoreBoostId = 'none' | 'krex-boost' | 'kas-overclock' | 'grid-efficiency';

export type PlantCardStatus =
  | 'EmptySlot'
  | 'SetupIncomplete'
  | 'ReadyToMine'
  | 'MiningActive'
  | 'ExtractionReady'
  | 'NeedsRepair'
  | 'NeedsPower';

export type IngredientBag = Record<MinecoreIngredient, number>;

export type OwnedItems = {
  machines: Record<MinecoreMachineId, number>;
  batteries: Record<MinecoreBatteryId, number>;
  workers: Record<MinecoreWorkerId, number>;
  modules: Record<MinecoreModuleId, number>;
};

export type PlantSetup = {
  machineId: MinecoreMachineId | null;
  batteryId: MinecoreBatteryId | null;
  workerId: MinecoreWorkerId | null;
  moduleIds: MinecoreModuleId[];
  boostId: MinecoreBoostId;
};

export type PlantCycle = {
  startAtMs: number;
  endAtMs: number;
  durationMs: number;
  expectedDiamonds: number;
};

export type PlantSlotState = {
  id: string;
  index: number;
  unlocked: boolean;
  unlockCostKas: number;
  status: PlantCardStatus;
  setup: PlantSetup;
  cycle: PlantCycle | null;
  powerRemaining: number;
  needsRepair: boolean;
};

export type MinecoreState = {
  version: number;
  diamondsBalance: number;
  refinementPointsTotal: number;
  gridRedeemableTotal: number;
  ingredients: IngredientBag;
  owned: OwnedItems;
  plantSlots: PlantSlotState[];
  nextSlotCostKas: number;
  lastConnectedAt: number | null;
  lastConnectedAddress: string | null;
};

export type MinecoreEvent =
  | { type: 'ConnectWallet'; address: string; at: number }
  | { type: 'UnlockSlot'; slotIndex: number; at: number }
  | { type: 'AddSlot'; at: number }
  | { type: 'CraftRecipe'; at: number; recipeId: string }
  | {
      type: 'InstallPart';
      slotIndex: number;
      at: number;
      part:
        | { kind: 'machine'; id: MinecoreMachineId | null }
        | { kind: 'battery'; id: MinecoreBatteryId | null }
        | { kind: 'worker'; id: MinecoreWorkerId | null }
        | { kind: 'modules'; ids: MinecoreModuleId[] }
        | { kind: 'boost'; id: MinecoreBoostId };
    }
  | { type: 'StartMining'; slotIndex: number; at: number }
  | { type: 'Extract'; slotIndex: number; at: number }
  | { type: 'TopUpPower'; slotIndex: number; at: number; added: number }
  | { type: 'Repair'; slotIndex: number; at: number }
  | { type: 'Refine'; at: number; amount: number }
  | { type: 'RedeemGrid'; at: number; points: number };

