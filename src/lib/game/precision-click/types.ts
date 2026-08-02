import type {
  PrecisionAddonId,
  PrecisionOperativeTier,
  PrecisionShopItemId,
} from '@/lib/game/precision-click/config';

export type PrecisionClickInventory = {
  shard_lens: number;
  null_filter: number;
};

export type PrecisionClickBoosterState = {
  mult: number;
  until: number;
  itemId: PrecisionShopItemId | null;
  txHash?: string;
};

export type PrecisionOperativeSlot = {
  nftRef: string;
  collection: string;
  tokenId: number;
  tier: PrecisionOperativeTier;
  /** Timestamp when this operative's time bonus was applied (prevents re-apply spam). */
  appliedAt: number;
  imageUrl?: string | null;
};

export type PrecisionClickPersistedState = {
  version: 3;
  walletAddress: string;
  /** Active lock after paying entry (false when expired or never paid). */
  entryUnlocked: boolean;
  entryTxHash?: string;
  /** Absolute expiry for the current lock window. */
  runExpiresAt: number | null;
  /** Add-ons purchased with the latest entry payment. */
  ownedAddons: PrecisionAddonId[];
  /** Levels cleared this lock (locked until run expires or new entry). */
  clearedLevels: number[];
  /** Highest level cleared this lock (0 = none). */
  highestClearedLevel: number;
  ariaFragments: number;
  fragmentsEarnedLifetime: number;
  refinementPointsTotal: number;
  inventory: PrecisionClickInventory;
  booster: PrecisionClickBoosterState | null;
  /**
   * Sync Operative deck slots. Index 0 is free; extras unlocked via Buy Slot.
   * Length is always >= 1. Empty entries are `null`.
   */
  operativeSlots: Array<PrecisionOperativeSlot | null>;
  updatedAt: number;
};

export function createEmptyPrecisionState(walletAddress: string): PrecisionClickPersistedState {
  return {
    version: 3,
    walletAddress,
    entryUnlocked: false,
    runExpiresAt: null,
    ownedAddons: [],
    clearedLevels: [],
    highestClearedLevel: 0,
    ariaFragments: 0,
    fragmentsEarnedLifetime: 0,
    refinementPointsTotal: 0,
    inventory: { shard_lens: 0, null_filter: 0 },
    booster: null,
    operativeSlots: [null],
    updatedAt: Date.now(),
  };
}

/** Migrate legacy single `operative` field into `operativeSlots`. */
export function normalizeOperativeSlots(
  parsed: Partial<PrecisionClickPersistedState> & { operative?: PrecisionOperativeSlot | null },
): Array<PrecisionOperativeSlot | null> {
  if (Array.isArray(parsed.operativeSlots) && parsed.operativeSlots.length > 0) {
    return parsed.operativeSlots.map((s) => (s && typeof s === 'object' && s.nftRef ? s : null));
  }
  if (parsed.operative && typeof parsed.operative === 'object' && parsed.operative.nftRef) {
    return [parsed.operative];
  }
  return [null];
}
