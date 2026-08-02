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
  operative: PrecisionOperativeSlot | null;
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
    operative: null,
    updatedAt: Date.now(),
  };
}
