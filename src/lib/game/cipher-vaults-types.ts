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

export interface CipherRun {
  runId: string;
  tierId: CipherVaultTierId;
  seed: string;
  startedAt: number;
  /** Absolute expiry for the solve countdown. */
  solveExpiresAt: number;
  /** Absolute expiry for the broader covenant window (Chrono / Warden extend). */
  covenantExpiresAt: number;
  paidBy: CipherPaymentType;
  entryTxHash?: string;
  addonIds: CipherAddonId[];
  moveLimit: number;
  fragmentMult: number;
  retriesLeft: number;
}

export interface CipherLedgerEntry {
  id: string;
  runId: string;
  tierId: CipherVaultTierId;
  solvedAt: number;
  moves: number;
  moveLimit: number;
  fragmentsBanked: number;
  entryTxHash?: string;
}

export interface CipherVaultsState {
  version: number;
  walletAddress: string;
  lastConnectedAt: number | null;
  /** Legacy DV ticket bridge fields (no longer used in UI). */
  redeemedRefinementPointsTotal: number;
  ticketsSpent: number;
  activeRun: CipherRun | null;
  ledger: CipherLedgerEntry[];
  /** In-game currency refined into Hub points. */
  cipherFragments: number;
  fragmentsEarnedLifetime: number;
  refinementPointsTotal: number;
  inventory: CipherInventory;
  booster: CipherBoosterState | null;
  ownedAddons: CipherAddonId[];
  /** Cipher Warden deck slots. Index 0 free; extras via Buy Slot. */
  wardenSlots: Array<CipherWardenSlot | null>;
  /** Covenant window open without an active puzzle (after Chrono extend edge cases). */
  covenantExpiresAt: number | null;
  updatedAt: number;
}

export function createInitialCipherVaultsState(walletAddress = ''): CipherVaultsState {
  return {
    version: 2,
    walletAddress,
    lastConnectedAt: null,
    redeemedRefinementPointsTotal: 0,
    ticketsSpent: 0,
    activeRun: null,
    ledger: [],
    cipherFragments: 0,
    fragmentsEarnedLifetime: 0,
    refinementPointsTotal: 0,
    inventory: { rune_hint: 0, vault_pass: 0 },
    booster: null,
    ownedAddons: [],
    wardenSlots: [null],
    covenantExpiresAt: null,
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
