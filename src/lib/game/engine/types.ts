import type { BonusType } from '@/lib/game/diamond-bonuses';

/** Five featured diamond families + rubble for pacing. */
export type DiamondCommodity =
  | 'chronoShard'
  | 'auroraCore'
  | 'cipherPrism'
  | 'eonCore'
  | 'eclipticFlame'
  | 'rubble';

export const DIAMOND_COMMODITY_KEYS: DiamondCommodity[] = [
  'chronoShard',
  'auroraCore',
  'cipherPrism',
  'eonCore',
  'eclipticFlame',
  'rubble',
];

export type MiningSlotType = 'worker' | 'operator' | 'foreman';

/** Resolved Minecore Workers-tab perk tier (persisted so server-style events match UI cap math). */
export type MinecoreNftPerkTier = 'regular' | 'diamond' | 'rarest';

/** Shop consumable ids for Diamond Veins worker restoration. */
export type DiamondVeinsConsumableId = 'field-ration' | 'energy-drink' | 'repair-kit';

export interface MiningSlot {
  type: MiningSlotType;
  nftId: number | null;
  collection: string | null;
  /**
   * When set, Minecore uses this for deck cap / battery bonuses instead of re-deriving from metadata
   * (needed for PIXELKREX diamonds and trait-based KREXPRIME diamonds after metadata loads).
   */
  minecorePerkTier?: MinecoreNftPerkTier;
  /**
   * Diamond Veins idle energy (0–energyMax). Mining only while nft is assigned and energy > 0.
   */
  energy?: number;
  /** Max energy for this session (set on deploy / restore from tier duration). */
  energyMax?: number;
}

export interface ActiveBoost {
  id: string;
  type: BonusType;
  multiplier: number;
  endTime: number;
  name?: string;
  pendingVerification?: boolean;
  txHash?: string;
}

export interface MachineTier {
  id: string;
  count: number;
  /** Power draw per unit (MW). */
  powerPerUnit: number;
  /** Yield multiplier per unit (stacked with diminishing returns in compute). */
  yieldPerUnit: number;
}

export interface AutomationState {
  autoRestartMiningRun: boolean;
  /** Max auto-starts of mining run per UTC day (Foreman / subscription). */
  autoRestartRunsCapPerDay: number;
  autoRestartRunsUsedToday: number;
  autoRestartLastUtcDate: string | null;
  /** Foreman NFT assigned (slot snapshot). */
  foremanActive: boolean;
}

/** Refine checkpoint row (legacy field name gridCheckpointScore = redeemable hub weight). */
export interface GridLedgerEntry {
  id: string;
  at: number;
  refinementPoints: number;
  diamondsRefined: number;
  /** Hub / redeem weight from this refine (historical name kept for persisted saves). */
  gridCheckpointScore: number;
  note: string;
}

export type RefineLedgerEntry = GridLedgerEntry;

export interface DiamondInventory {
  chronoShard: number;
  auroraCore: number;
  cipherPrism: number;
  eonCore: number;
  eclipticFlame: number;
  rubble: number;
}

export type DiamondVeinsConsumableInventory = Record<DiamondVeinsConsumableId, number>;

export interface TyconGameState {
  version: number;
  diamonds: number;
  diamondInventory: DiamondInventory;
  slots: MiningSlot[];
  lastRefinedAt: number;
  refinementPointsTotal: number;
  /** Lifetime diamonds mined (for milestones). */
  diamondsEarnedLifetime: number;
  miningRunEndTime: number;
  miningRunMultiplier: number;
  miningRunOptionIndex: number | null;
  activeBoosts: ActiveBoost[];
  lastConnectedAt: number | null;
  lastConnectedAddress: string | null;
  /** Wall-clock ms of last idle mining tick (offline catch-up). */
  lastIdleTickAt: number | null;
  machines: MachineTier[];
  /** Total power budget (MW). */
  powerCapMw: number;
  automation: AutomationState;
  /** Refine checkpoints (also returned from API). */
  gridLedger: GridLedgerEntry[];
  /** Registered L1/L2 purchase receipts (tx idempotency). */
  appliedReceiptIds: string[];
  /** Shop-bought consumables for restoring worker energy. */
  consumables: DiamondVeinsConsumableInventory;
}

export type GameEvent =
  | { type: 'DeployNFT'; slotIndex: number; nftId: number; collection: string; energyMax?: number }
  | { type: 'RemoveSlot'; slotIndex: number }
  | { type: 'AddNftDeckSlot'; slotType: MiningSlotType; at: number }
  | { type: 'Refine'; at: number; amount?: number }
  | { type: 'AddBoost'; boost: ActiveBoost }
  | { type: 'StartMiningRun'; optionIndex: number; at: number; durationMs: number; mult: number }
  | { type: 'AccumulateDiamonds'; delta: number; at: number }
  | { type: 'DistributeDiamondDelta'; delta: number; weights: Record<DiamondCommodity, number>; at: number }
  | { type: 'TickIdleMining'; deltaSeconds: number; slotDeltas: number[]; energyDrains: number[]; at: number }
  | { type: 'AddMachine'; machine: MachineTier }
  | { type: 'UpgradePower'; addedMw: number }
  | { type: 'SetAutomation'; patch: Partial<AutomationState> }
  | { type: 'RegisterReceipt'; receiptId: string; at: number }
  | { type: 'RedeemPoints'; points: number; at: number }
  /** @deprecated Prefer RedeemPoints */
  | { type: 'RedeemGrid'; points: number; at: number }
  | { type: 'HeartbeatConnect'; address: string; at: number }
  | { type: 'SyncVersion'; version: number }
  | { type: 'AddConsumables'; itemId: DiamondVeinsConsumableId; count: number; at: number }
  | { type: 'FeedWorker'; slotIndex: number; itemId: DiamondVeinsConsumableId; energyRestore: number; at: number };

export interface SlotYieldInfo {
  slotIndex: number;
  yieldPerSecond: number;
  energy: number;
  energyMax: number;
  status: 'empty' | 'mining' | 'exhausted' | 'paused';
  remainingMs: number;
}

export interface YieldStats {
  yieldPerSecond: number;
  totalMultiplier: number;
  rawYield: number;
  /** Effective power cap after brownout (0–1 efficiency). Legacy field; idle model keeps 1. */
  powerEfficiency: number;
  powerUsedMw: number;
  powerCapMw: number;
  /** Per-slot idle mining breakdown. */
  slots: SlotYieldInfo[];
}

export interface NFTEffectInput {
  collection: string;
  nftId: number;
  /** Precomputed tier key for worker/operator math. */
  tier: 'regular' | 'diamond' | 'rarest';
  /** Sum of trait yield bonuses as fraction of BASE_YIELDS.WORKER_BASE. */
  traitYieldAdd: number;
  /** Sum of speed bonuses as additive to operator mult. */
  traitSpeedAdd: number;
}
