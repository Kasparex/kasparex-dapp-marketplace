import type {
  CipherAddonId,
  CipherShopItemId,
  CipherVaultTierId,
  CipherWardenTier,
} from '@/lib/game/cipher-vaults-config';

export type CipherPaymentType = 'KAS' | 'KREX' | 'VAULT_PASS';

export type CipherInventory = {
  rune_hint: number;
  vault_pass: number;
};

export type CipherBoosterState = {
  mult: number;
  until: number;
  itemId: CipherShopItemId | null;
  txHash?: string;
};

export type CipherWardenSlot = {
  nftRef: string;
  collection: string;
  tokenId: number;
  tier: CipherWardenTier;
  appliedAt: number;
  imageUrl?: string | null;
};

/** Active in-progress level attempt inside an open covenant. */
export type CipherActiveLevel = {
  levelId: number;
  seed: string;
  startedAt: number;
  solveExpiresAt: number;
  moveLimit: number;
  size: number;
  initial: number[];
  target: number[];
  /** Target cell indices hidden by fog. */
  fogHidden: number[];
};

export interface CipherLedgerEntry {
  id: string;
  levelId: number;
  tierId: CipherVaultTierId;
  solvedAt: number;
  moves: number;
  moveLimit: number;
  fragmentsBanked: number;
  sealPointsEarned: number;
  entryTxHash?: string;
}

export interface CipherVaultsState {
  version: 3;
  walletAddress: string;
  lastConnectedAt: number | null;
  redeemedRefinementPointsTotal: number;
  ticketsSpent: number;
  /** @deprecated Prefer entryUnlocked + activeLevel. Kept for migration. */
  activeRun: null;
  ledger: CipherLedgerEntry[];
  cipherFragments: number;
  fragmentsEarnedLifetime: number;
  refinementPointsTotal: number;
  /** Session seal points (correct placements). Not refined. */
  sealPoints: number;
  inventory: CipherInventory;
  booster: CipherBoosterState | null;
  ownedAddons: CipherAddonId[];
  wardenSlots: Array<CipherWardenSlot | null>;
  entryUnlocked: boolean;
  entryTxHash?: string;
  vaultTierId: CipherVaultTierId | null;
  covenantExpiresAt: number | null;
  clearedLevels: number[];
  highestClearedLevel: number;
  retriesLeft: number;
  fragmentMult: number;
  activeLevel: CipherActiveLevel | null;
  updatedAt: number;
}

export function createInitialCipherVaultsState(walletAddress = ''): CipherVaultsState {
  return {
    version: 3,
    walletAddress,
    lastConnectedAt: null,
    redeemedRefinementPointsTotal: 0,
    ticketsSpent: 0,
    activeRun: null,
    ledger: [],
    cipherFragments: 0,
    fragmentsEarnedLifetime: 0,
    refinementPointsTotal: 0,
    sealPoints: 0,
    inventory: { rune_hint: 0, vault_pass: 0 },
    booster: null,
    ownedAddons: [],
    wardenSlots: [null],
    entryUnlocked: false,
    vaultTierId: null,
    covenantExpiresAt: null,
    clearedLevels: [],
    highestClearedLevel: 0,
    retriesLeft: 0,
    fragmentMult: 1,
    activeLevel: null,
    updatedAt: Date.now(),
  };
}

export function normalizeWardenSlots(
  parsed: Partial<CipherVaultsState>,
): Array<CipherWardenSlot | null> {
  if (Array.isArray(parsed.wardenSlots) && parsed.wardenSlots.length > 0) {
    return parsed.wardenSlots.map((s) => (s && typeof s === 'object' && s.nftRef ? s : null));
  }
  return [null];
}
