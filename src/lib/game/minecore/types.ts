import type { GridLedgerEntry } from '@/lib/game/engine';

export type MinecoreIngredient =
  | 'crystalDust' | 'alloyPlates' | 'circuitMesh' | 'energyCells'
  | 'coreShards' | 'coolingGel' | 'ariaChips' | 'nullFragments'
  | 'fluxCoils' | 'latticeWire';

export const MINECORE_INGREDIENT_KEYS: MinecoreIngredient[] = [
  'crystalDust', 'alloyPlates', 'circuitMesh', 'energyCells',
  'coreShards', 'coolingGel', 'ariaChips', 'nullFragments',
  'fluxCoils', 'latticeWire',
];

export type MinecoreMachineId =
  | 'pulse-drill'
  | 'crystal-extractor'
  | 'deep-vein-rig'
  | 'quantum-fracturer'
  | 'magma-tap'
  | 'orbit-siphon';

export type MinecoreBatteryId =
  | 'energy-cell'
  | 'battery-pack'
  | 'diamond-capacitor'
  | 'grid-battery'
  | 'flux-array'
  | 'void-core-cell';

export type MinecoreWorkerId   = 'worker' | 'operator';
export type MinecoreModuleId =
  | 'cooling-module'
  | 'stability-module'
  | 'aria-sensor'
  | 'vector-drill-chip'
  | 'regen-coil'
  | 'hash-buffer';

export type MinecoreBoostId    = 'none' | 'krex-boost' | 'kas-overclock' | 'grid-efficiency';

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
  | 'NeedsPower'
  /** Production below consumption beyond playable threshold — cannot start a cycle. */
  | 'InsufficientPower';

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
  /** UTC `YYYY-MM-DD` for `dailyCapMinedDiamonds`. */
  dailyCapDayKey: string;
  /**
   * Diamonds credited toward today's 24h cap from extract/refine (uncredited diamonds stay in live + accumulated).
   */
  dailyCapMinedDiamonds: number;
};

export type MinecoreAutomationState = {
  autoRestart:    boolean;
  foremanActive:  boolean;
};

/** Client-side redeem budget (honest mode until server enforces pool). */
export type MinecoreRedeemBudget = {
  /** UTC calendar day `YYYY-MM-DD` for daily caps. */
  dayKey: string;
  refinementPointsSpentOnGrid: number;
  refinementPointsSpentOnKrex: number;
};

export type MinecoreState = {
  version:                  number;
  diamondsBalance:          number;
  refinementPointsTotal:    number;
  gridRedeemableTotal:      number;
  krexRedeemableTotal:      number;
  ingredients:              IngredientBag;
  owned:                    OwnedItems;
  plantSlots:               PlantSlotState[];
  nextSlotCostKas:          number;
  nftSlots:                 import('@/lib/game/engine').MiningSlot[];
  gridLedger:               GridLedgerEntry[];
  automation:               MinecoreAutomationState;
  lastConnectedAt:          number | null;
  lastConnectedAddress:     string | null;
  redeemBudget:             MinecoreRedeemBudget;
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
        | { kind: 'worker';   id: MinecoreWorkerId | null }
        | { kind: 'modules';  ids: MinecoreModuleId[] }
        | { kind: 'boost';    id: MinecoreBoostId };
    }
  | { type: 'StartMining';  slotIndex: number; at: number }
  /** Pauses an active run without banking/clearing; preserves power & cycle progress. */
  | { type: 'StopMining';  slotIndex: number; at: number }
  | { type: 'ResumeMining'; slotIndex: number; at: number }
  | { type: 'Extract';      slotIndex: number; at: number }
  | { type: 'TopUpPower';   slotIndex: number; at: number; added: number }
  | { type: 'Repair';       slotIndex: number; at: number }
  | { type: 'Refine';       at: number; amount: number; walletAddress: string }
  | {
      type: 'RedeemGrid';
      at: number;
      points: number;
      token: 'GRID' | 'KREX';
      walletAddress: string;
    };
