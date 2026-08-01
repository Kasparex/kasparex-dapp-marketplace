import type {
  PrecisionAddonId,
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

export type PrecisionClickPersistedState = {
  version: 2;
  walletAddress: string;
  /** Entry paid unlocks Play for this wallet. */
  entryUnlocked: boolean;
  entryTxHash?: string;
  /** Add-ons purchased with the latest entry payment. */
  ownedAddons: PrecisionAddonId[];
  /** Highest level cleared (0 = none). Next playable = cleared + 1, capped at 10. */
  highestClearedLevel: number;
  ariaFragments: number;
  fragmentsEarnedLifetime: number;
  refinementPointsTotal: number;
  inventory: PrecisionClickInventory;
  booster: PrecisionClickBoosterState | null;
  updatedAt: number;
};

export function createEmptyPrecisionState(walletAddress: string): PrecisionClickPersistedState {
  return {
    version: 2,
    walletAddress,
    entryUnlocked: false,
    ownedAddons: [],
    highestClearedLevel: 0,
    ariaFragments: 0,
    fragmentsEarnedLifetime: 0,
    refinementPointsTotal: 0,
    inventory: { shard_lens: 0, null_filter: 0 },
    booster: null,
    updatedAt: Date.now(),
  };
}
