/**
 * Covenant Lab types.
 * Models covenant UTXO state for programmable L1 money (simulator today, Silverscript post-Toccata).
 */

export type CovenantVaultKind = 'escrow' | 'timelock';

export type CovenantVaultStatus = 'locked' | 'claimed';

/** How the runtime executes covenant logic. */
export type CovenantRuntimeMode = 'simulator' | 'silverscript' | 'hybrid';

export interface CovenantUtxoRef {
  txId: string;
  index: number;
}

export interface CovenantVault {
  id: string;
  /** KIP-20 covenant lineage id (hex). */
  covenantId: string;
  kind: CovenantVaultKind;
  status: CovenantVaultStatus;
  /** Vault creator (kaspa address). */
  depositor: string;
  /** Primary claimer (kaspa address). Same as beneficiaries[0]. */
  beneficiary: string;
  /**
   * All wallets allowed to claim this lock (Hub-enforced allowlist).
   * First entry is also written into the on-chain deploy payload as beneficiary.
   * For share-split locks, this is a single address (one vault per claimer).
   */
  beneficiaries?: string[];
  /** Locked amount in sompi (string for bigint safety). */
  amountSompi: string;
  /** Share of the original group total in basis points (10000 = 100%). */
  shareBps?: number;
  /** Links sibling share vaults created together from one LockBox create. */
  groupId?: string;
  /** Human label / memo. */
  memo: string;
  /** Unix ms when claim is allowed (timelock only). */
  unlockAt: number | null;
  createdAt: number;
  claimedAt: number | null;
  /** L1 tx that funded the lock. */
  lockTxHash?: string;
  /** L1 tx on claim. */
  claimTxHash?: string;
  /** Hub claim-fee tx paid before unlock (fee-first flow / retry). */
  claimFeeTxHash?: string;
  /** Live covenant UTXO outpoint (silverscript mode). */
  utxo?: CovenantUtxoRef;
  /** Where this record was created. Omitted on legacy rows. */
  origin?: 'l1' | 'simulator';
}

export interface CreateVaultParams {
  kind: CovenantVaultKind;
  depositor: string;
  /** Primary claimer (required). Prefer beneficiaries when multiple. */
  beneficiary: string;
  /** Optional extra claimers; primary should be first. */
  beneficiaries?: string[];
  amountSompi: string;
  shareBps?: number;
  groupId?: string;
  memo: string;
  unlockAt: number | null;
  lockTxHash?: string;
}

export interface VaultListFilter {
  address?: string;
  role?: 'depositor' | 'beneficiary' | 'any';
  status?: CovenantVaultStatus;
}

export interface CovenantLabConfig {
  minLockSompi: string;
  maxMemoLength: number;
  /** @deprecated Legacy mixed simulator+L1 key; migrated on load then cleared. */
  storageKey: string;
  /** On-chain / silverscript LockBox vaults only. */
  storageKeyL1: string;
  /** Local simulator LockBox vaults (kept separate; purged from Hub UI). */
  storageKeySim: string;
  splitStorageKey: string;
  milestoneStorageKey: string;
  crowdfundStorageKey: string;
  voucherStorageKey: string;
  treasuryAddress: string;
  runtimeMode: CovenantRuntimeMode;
}
