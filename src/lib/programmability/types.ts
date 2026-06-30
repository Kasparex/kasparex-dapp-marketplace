/**
 * Shared L1 programmability types (Toccata / transaction v1).
 * Consumed by covenant runtimes; vProgs can reuse later.
 */

/** Transaction version 1 per-input compute budget (script units). */
export type ComputeBudget = number;

/** Reference to a spent or created UTXO. */
export interface UtxoOutpoint {
  txId: string;
  index: number;
}

/** KIP-20 covenant binding on a transaction output. */
export interface CovenantBinding {
  /** Input index that authorizes this covenant output. */
  authorizingInput: number;
  /** 32-byte lineage id (hex, 64 chars). */
  covenantId: string;
}

export type CovenantTemplate =
  | 'lockbox'
  | 'split'
  | 'milestone'
  | 'crowdfund'
  | 'voucher';

/** Wallet or Hub covenant transaction request. */
export interface CovenantTxRequest {
  template: CovenantTemplate;
  params: Record<string, unknown>;
  computeBudget?: ComputeBudget;
  spendOutpoint?: UtxoOutpoint;
}

/** Result from a covenant L1 transaction submission. */
export interface CovenantTxResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  error?: string;
  outpoint?: UtxoOutpoint;
  covenantId?: string;
}

/** Wallet-reported Toccata capability flags. */
export interface CovenantCapabilities {
  txV1: boolean;
  covenantBindings: boolean;
  canSendCovenantTx: boolean;
}

export interface CovenantArtifactMeta {
  template: CovenantTemplate;
  contract: string;
  silverscriptVersion: string;
  sourceFile: string;
  compiledAt: string;
  /** Compiled redeem script bytes (hex). Null until silverc output is committed. */
  scriptHex: string | null;
  note?: string;
}
