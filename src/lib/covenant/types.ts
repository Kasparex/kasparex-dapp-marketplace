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
  /** Who may claim when rules pass. */
  beneficiary: string;
  /** Locked amount in sompi (string for bigint safety). */
  amountSompi: string;
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
  /** Live covenant UTXO outpoint (silverscript mode). */
  utxo?: CovenantUtxoRef;
  /** Where this record was created. Omitted on legacy rows. */
  origin?: 'l1' | 'simulator';
}

export interface CreateVaultParams {
  kind: CovenantVaultKind;
  depositor: string;
  beneficiary: string;
  amountSompi: string;
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
