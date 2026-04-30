import type { GridLedgerEntry, MinecoreNftPerkTier, MiningSlotType } from '@/lib/game/engine';

export type MinecoreIngredient =
  | 'crystalDust' | 'alloyPlates' | 'circuitMesh' | 'energyCells'
  | 'coreShards' | 'coolingGel' | 'ariaChips' | 'nullFragments'
  | 'fluxCoils' | 'latticeWire'
  | 'helixStabilizers' | 'plasmaConduits' | 'quantumAttuners' | 'voidglassFilaments';

export const MINECORE_INGREDIENT_KEYS: MinecoreIngredient[] = [
  'crystalDust', 'alloyPlates', 'circuitMesh', 'energyCells',
  'coreShards', 'coolingGel', 'ariaChips', 'nullFragments',
  'fluxCoils', 'latticeWire',
  'helixStabilizers', 'plasmaConduits', 'quantumAttuners', 'voidglassFilaments',
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

/** Craftable supplemental reactors — one equipped per plant; each adds kW to plant max power. */
export type MinecorePowerNodeId =
  | 'flux-node'
  | 'lattice-node'
  | 'core-node'
  | 'prismatic-reactor'
  | 'stellar-forge-reactor';

export const MINECORE_POWER_NODE_IDS: MinecorePowerNodeId[] = [
  'flux-node',
  'lattice-node',
  'core-node',
  'prismatic-reactor',
  'stellar-forge-reactor',
];

export type MinecoreBoostId    = 'none' | 'krex-boost' | 'kas-overclock' | 'grid-efficiency';

export type PlantType = 'standard' | 'premium' | 'advanced';

export type PlantCardStatus =
  | 'EmptySlot'
  | 'SetupIncomplete'
  | 'ReadyToMine'
  | 'MiningActive'
  | 'MiningPaused'    // run suspended - no diamond gain, no battery drain, parts editable after stop
  | 'BatteryEmpty'   // was running but battery charge ran to zero mid-cycle
  /** Session ready to bank (e.g. rolling cap reached while mining; legacy time-based cycle end removed). */
  | 'CreditingReady'
  | 'NeedsRepair'
  | 'NeedsPower'
  /** Rolling 24h diamond cap reached - start new cycles after the window resets (or extract/refine backlog). */
  | 'DailyCapReached'
  /** Production below consumption beyond playable threshold - cannot start a cycle. */
  | 'InsufficientPower';

export type IngredientBag = Record<MinecoreIngredient, number>;

export type OwnedItems = {
  machines:  Record<MinecoreMachineId, number>;
  batteries: Record<MinecoreBatteryId, number>;
  workers:   Record<MinecoreWorkerId, number>;
  modules:   Record<MinecoreModuleId, number>;
  /** Fabricated reactors — inventory count before assigning to a plant (`nodes` key is legacy persistence). */
  nodes:     Record<MinecorePowerNodeId, number>;
};

export type PlantSetup = {
  machineId: MinecoreMachineId | null;
  /** Optional reactor adds max power (kW) at this plant. One slot — swap like a rig. */
  powerNodeId: MinecorePowerNodeId | null;
  /** One entry per plant power-unit slot (1 / 2 / 4 by tier). null = empty slot. */
  batteryIds: (MinecoreBatteryId | null)[];
  /**
   * Single Workers-tab NFT slot index (`minecoreState.nftSlots`). One index per plant. Distinct indices per plant globally.
   */
  workerNftDeckSlotIndices: (number | null)[];
  moduleIds: MinecoreModuleId[];
  boostId: MinecoreBoostId;
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
  /** Plant-tier reserve power unit capacity; not spent per run in V1 display - synced in derive. */
  powerRemaining:   number;
  /** Legacy flag; wear is driven by `plantLastServicedAtMs`. Cleared on Repair. */
  needsRepair:      boolean;
  /** Milliseconds timestamp: maintenance / wear clock anchor (repair resets this). */
  plantLastServicedAtMs: number;
  /**
   * Per power-unit slot: remaining charge (ms) at `batterySnapshotAt`. Drains waterfall (slot 0 first).
   */
  batterySlotChargeMs: number[];
  /** Timestamp (ms) when `batterySlotChargeMs` was last written (cycle start or refill). */
  batterySnapshotAt: number;
  /** Diamonds earned in previous cycles but not yet extracted. */
  diamondsAccumulated: number;
  /**
   * Start timestamp (ms) of the current rolling 24h output cap window (set when the plant is activated).
   */
  rollingCapWindowStartMs: number;
  /**
   * Diamonds credited toward the current rolling 24h cap from extract/refine (uncredited stay in live + accumulated).
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
  /** Lifetime refinement points minted from diamonds via Refine (Redeem spends reduce refinementPointsTotal only). */
  refinementPointsEarnedLifetime: number;
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
  /** In-game GRID balance (redeemable total) shop purchase — no L1 transaction. */
  | { type: 'BuyIngredientWithGrid'; at: number; ingredient: MinecoreIngredient; amount: number; gridCost: number }
  | { type: 'DeployNFT';        at: number; slotIndex: number; nftId: number; collection: string }
  | { type: 'RemoveNFT';        at: number; slotIndex: number }
  | { type: 'SyncMinecoreNftPerkTier'; at: number; slotIndex: number; tier: MinecoreNftPerkTier | null }
  | { type: 'AddNftDeckSlot';   at: number; slotType: MiningSlotType }
  | { type: 'SetAutomation';    at: number; patch: Partial<MinecoreAutomationState> }
  | { type: 'RefillBattery';    slotIndex: number; at: number }  // refill battery to full
  /** Paid KAS action: refill one or more battery slots (no new reserve units). */
  | {
      type: 'RechargePlant';
      slotIndex: number;
      at: number;
      /** Refill these indices (each must have a battery installed). Omit = first populated slot. */
      batterySlotIndexes?: number[];
      batterySlotIndex?: number;
    }
  | {
      type: 'InstallPart';
      slotIndex: number;
      at: number;
      part:
        | { kind: 'machine';  id: MinecoreMachineId | null }
        | { kind: 'battery'; id: MinecoreBatteryId | null; /** Which battery slot (0..n-1) on this plant. */ batterySlotIndex?: number }
        | { kind: 'crewWorkerNftDeck'; deckSlotIndex: number | null; workerSlotPosition?: number }
        | { kind: 'powerNode'; id: MinecorePowerNodeId | null }
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
