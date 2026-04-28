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

export interface MiningSlot {
  type: MiningSlotType;
  nftId: number | null;
  collection: string | null;
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

export interface GridLedgerEntry {
  id: string;
  at: number;
  refinementPoints: number;
  diamondsRefined: number;
  /** Eligible GRID weight for L2 claim flow (off-chain score until FeeRouter). */
  gridCheckpointScore: number;
  note: string;
}

export interface DiamondInventory {
  chronoShard: number;
  auroraCore: number;
  cipherPrism: number;
  eonCore: number;
  eclipticFlame: number;
  rubble: number;
}

export interface TyconGameState {
  version: number;
  diamonds: number;
  diamondInventory: DiamondInventory;
  slots: MiningSlot[];
  lastRefinedAt: number;
  refinementPointsTotal: number;
  miningRunEndTime: number;
  miningRunMultiplier: number;
  miningRunOptionIndex: number | null;
  activeBoosts: ActiveBoost[];
  lastConnectedAt: number | null;
  lastConnectedAddress: string | null;
  machines: MachineTier[];
  /** Total power budget (MW). */
  powerCapMw: number;
  automation: AutomationState;
  /** Server-maintained copy of GRID-related refine checkpoints (also returned from API). */
  gridLedger: GridLedgerEntry[];
  /** Registered L1/L2 purchase receipts (tx idempotency). */
  appliedReceiptIds: string[];
}

export type GameEvent =
  | { type: 'DeployNFT'; slotIndex: number; nftId: number; collection: string }
  | { type: 'RemoveSlot'; slotIndex: number }
  | { type: 'Refine'; at: number }
  | { type: 'AddBoost'; boost: ActiveBoost }
  | { type: 'StartMiningRun'; optionIndex: number; at: number; durationMs: number; mult: number }
  | { type: 'AccumulateDiamonds'; delta: number; at: number }
  | { type: 'DistributeDiamondDelta'; delta: number; weights: Record<DiamondCommodity, number>; at: number }
  | { type: 'AddMachine'; machine: MachineTier }
  | { type: 'UpgradePower'; addedMw: number }
  | { type: 'SetAutomation'; patch: Partial<AutomationState> }
  | { type: 'RegisterReceipt'; receiptId: string; at: number }
  | { type: 'RedeemGrid'; points: number; at: number }
  | { type: 'HeartbeatConnect'; address: string; at: number }
  | { type: 'SyncVersion'; version: number };

export interface YieldStats {
  yieldPerSecond: number;
  totalMultiplier: number;
  rawYield: number;
  /** Effective power cap after brownout (0–1 efficiency). */
  powerEfficiency: number;
  powerUsedMw: number;
  powerCapMw: number;
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
