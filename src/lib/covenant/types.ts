/**
 * Covenant Lab types.
 * Models covenant UTXO state for programmable L1 money (simulator today, Silverscript post-Toccata).
 */

export type CovenantVaultKind = 'escrow' | 'timelock';

export type CovenantVaultStatus = 'locked' | 'claimed';

/** How the runtime executes covenant logic. */
export type CovenantRuntimeMode = 'simulator' | 'silverscript' | 'vprogs';

export interface CovenantVault {
  id: string;
  /** Simulated KIP-20 covenant lineage id (hex). */
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
  /** L1 tx that funded the lock (demo treasury send). */
  lockTxHash?: string;
  /** Simulated covenant transition tx on claim. */
  claimTxHash?: string;
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
  storageKey: string;
  splitStorageKey: string;
  milestoneStorageKey: string;
  crowdfundStorageKey: string;
  voucherStorageKey: string;
  treasuryAddress: string;
  runtimeMode: CovenantRuntimeMode;
}
