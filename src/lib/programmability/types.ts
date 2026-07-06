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

/** KaspaCom / silverc compiled contract JSON (passed through to wallet). */
export interface CovenantCompiledContract {
  contract_name: string;
  script: number[];
  abi: Array<{
    name: string;
    inputs: Array<{ name: string; type_name: string }>;
  }>;
  ast?: Record<string, unknown>;
  without_selector?: boolean;
  tn10?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Wallet or Hub covenant transaction request (KaspaCom SDK aligned). */
export interface CovenantTxRequest {
  template: CovenantTemplate;
  /** deploy locks a new covenant UTXO; spend calls an entrypoint */
  kind?: 'deploy' | 'spend';
  functionName?: string;
  params: Record<string, unknown>;
  computeBudget?: ComputeBudget;
  spendOutpoint?: UtxoOutpoint;
  /** KaspaCom CompiledContract subset for wallet-side tx building */
  compiled?: CovenantCompiledContract | null;
  /** Hex-encoded tx.payload (deploy claims for indexer) */
  transactionPayloadHex?: string;
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
  /** Full KaspaCom / silverc compiled contract when available */
  compiled?: CovenantCompiledContract | null;
  note?: string;
}
