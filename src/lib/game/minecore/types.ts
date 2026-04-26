import type { GridLedgerEntry } from '@/lib/game/engine';

export type MinecoreIngredient =
  | 'crystalDust' | 'alloyPlates' | 'circuitMesh' | 'energyCells'
  | 'coreShards' | 'coolingGel' | 'ariaChips' | 'nullFragments';

export const MINECORE_INGREDIENT_KEYS: MinecoreIngredient[] = [
  'crystalDust', 'alloyPlates', 'circuitMesh', 'energyCells',
  'coreShards', 'coolingGel', 'ariaChips', 'nullFragments',
];

export type MinecoreMachineId  = 'pulse-drill' | 'crystal-extractor' | 'deep-vein-rig' | 'quantum-fracturer';
export type MinecoreBatteryId  = 'energy-cell' | 'battery-pack' | 'diamond-capacitor' | 'grid-battery';
export type MinecoreWorkerId   = 'worker' | 'operator';
export type MinecoreModuleId   = 'cooling-module' | 'stability-module' | 'aria-sensor' | 'vector-drill-chip';
export type MinecoreBoostId    = 'none' | 'krex-boost' | 'kas-overclock' | 'grid-efficiency';

/** On-site power generation / distribution; caps reserve units and tweaks drain. Built with Shop ingredients. */
export type MinecorePowerSourceId =
  | 'vein-thermal'      // deep BlockDAG conduction
  | 'fission-bdag'     // “fuel rod” of packed DAG history
  | 'krex-catalyst'    // Krex-era catalytic stack
  | 'aria-photon'      // synthetic solar over the ARIA lattice
  | 'null-reactor';    // null-fragment cold plasma

export type PlantType = 'standard' | 'premium' | 'advanced';

export type PlantCardStatus =
  | 'EmptySlot'
  | 'SetupIncomplete'
  | 'ReadyToMine'
  | 'MiningActive'
  | 'MiningPaused'    // run suspended — no diamond gain, no battery drain, parts editable after stop
  | 'BatteryEmpty'   // was running but battery charge ran to zero mid-cycle
  | 'ExtractionReady'
  | 'NeedsRepair'
  | 'NeedsPower';

export type IngredientBag = Record<MinecoreIngredient, number>;

export type OwnedItems = {
  machines:  Record<MinecoreMachineId, number>;
  batteries: Record<MinecoreBatteryId, number>;
  workers:   Record<MinecoreWorkerId, number>;
  modules:   Record<MinecoreModuleId, number>;
};

export type PlantSetup = {
  machineId:  MinecoreMachineId | null;
  batteryId:  MinecoreBatteryId | null;
  powerSourceId: MinecorePowerSourceId | null;
  workerId:   MinecoreWorkerId | null;
  moduleIds:  MinecoreModuleId[];
  boostId:    MinecoreBoostId;
};

export type PlantCycle = {
  startAtMs:        number;
  endAtMs:          number;
  durationMs:       number;
  expectedDiamonds: number;
  /** Diamonds already siphoned from this cycle (e.g. via Refine) so they no longer count as live. */
  mintedOffset?:   number;
  /** When set, the run is paused: no new diamonds, no battery drain, power/cycle stats preserved. */
  pauseBeganAtMs:  number | null;
};

export type PlantSlotState = {
  id:               string;
  index:            number;
  unlocked:         boolean;
  unlockCostKas:    number;
  type:             PlantType;
  status:           PlantCardStatus;
  setup:            PlantSetup;
  cycle:            PlantCycle | null;
  powerRemaining:   number;  // fuel-tank units; each StartMining costs 1
  needsRepair:      boolean;
  /** Base charge remaining (ms) at the time `batterySnapshotAt` was written. */
  batteryChargeMs:   number;
  /** Timestamp (ms) when batteryChargeMs was last written (cycle start or refill). */
  batterySnapshotAt: number;
  /** Diamonds earned in previous cycles but not yet extracted. */
  diamondsAccumulated: number;
};

export type MinecoreAutomationState = {
  autoRestart:    boolean;
  foremanActive:  boolean;
};

export type MinecoreState = {
  version:                  number;
  diamondsBalance:          number;
  refinementPointsTotal:    number;
  gridRedeemableTotal:      number;
  ingredients:              IngredientBag;
  owned:                    OwnedItems;
  plantSlots:               PlantSlotState[];
  nextSlotCostKas:          number;
  nftSlots:                 import('@/lib/game/engine').MiningSlot[];
  gridLedger:               GridLedgerEntry[];
  automation:               MinecoreAutomationState;
  lastConnectedAt:          number | null;
  lastConnectedAddress:     string | null;
};

export type MinecoreEvent =
  | { type: 'ConnectWallet';    address: string; at: number }
  | { type: 'UnlockSlot';       slotIndex: number; at: number }
  | { type: 'ChangePlantType';  slotIndex: number; at: number; plantType: PlantType }
  | { type: 'AddSlot';          at: number }
  | { type: 'CraftRecipe';      at: number; recipeId: string }
  | { type: 'AddIngredients';   at: number; ingredient: MinecoreIngredient; amount: number }
  | { type: 'DeployNFT';        at: number; slotIndex: number; nftId: number; collection: string }
  | { type: 'RemoveNFT';        at: number; slotIndex: number }
  | { type: 'SetAutomation';    at: number; patch: Partial<MinecoreAutomationState> }
  | { type: 'RefillBattery';    slotIndex: number; at: number }  // refill battery to full
  /** Paid KAS action: add reserve unit(s) and fully recharge battery in one step. */
  | { type: 'RechargePlant';    slotIndex: number; at: number; units?: number }
  | {
      type: 'InstallPart';
      slotIndex: number;
      at: number;
      part:
        | { kind: 'machine';  id: MinecoreMachineId | null }
        | { kind: 'battery';  id: MinecoreBatteryId | null }
        | { kind: 'powerSource'; id: MinecorePowerSourceId | null }
        | { kind: 'worker';   id: MinecoreWorkerId | null }
        | { kind: 'modules';  ids: MinecoreModuleId[] }
        | { kind: 'boost';    id: MinecoreBoostId };
    }
  | /** Spend ingredients and mount a power source (see `MINECORE_POWER_SOURCES`). */
  { type: 'InstallPowerFromIngredients'; slotIndex: number; at: number; powerSourceId: MinecorePowerSourceId }
  | { type: 'StartMining';  slotIndex: number; at: number }
  /** Pauses an active run without banking/clearing; preserves power & cycle progress. */
  | { type: 'StopMining';  slotIndex: number; at: number }
  | { type: 'ResumeMining'; slotIndex: number; at: number }
  | { type: 'Extract';      slotIndex: number; at: number }
  | { type: 'TopUpPower';   slotIndex: number; at: number; added: number }
  | { type: 'Repair';       slotIndex: number; at: number }
  | { type: 'Refine';       at: number; amount: number }
  | { type: 'RedeemGrid';   at: number; points: number };
