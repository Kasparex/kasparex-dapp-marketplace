/**
 * KaspaCom covenant-sdk aligned types (wallet deploy/spend contract).
 * Hub does not embed kaspa-wasm or hold private keys; wallets implement execution.
 *
 * @see https://github.com/KASPACOM/kaspacom-web-wallet/tree/feat/covenants-support/src/app/services/covenant/covenant-sdk
 */

import type { CovenantCompiledContract, CovenantTemplate } from '@/lib/programmability/types';
import type { ProgrammableNetworkId } from '@/lib/programmable/config';

export type CovenantTxKind = 'deploy' | 'spend';

export interface KaspaComCompiledAbiInput {
  name: string;
  type_name: string;
}

export interface KaspaComCompiledAbiEntry {
  name: string;
  inputs: KaspaComCompiledAbiInput[];
}

/** Subset of silverc / KaspaCom CompiledContract stored in public/covenant/*.json */
export type KaspaComCompiledContract = CovenantCompiledContract;

export interface KaspaComCovenantOutpoint {
  txid: string;
  vout: number;
}

export interface KaspaComSpendOutput {
  address: string;
  amountSompi: string;
  covenantId?: string;
}

export interface KaspaComPayloadArg {
  name: string;
  type: 'address' | 'u64' | 'string' | 'pubkey' | 'hex';
  value: string;
}

export interface CovenantDeployRequest {
  template: CovenantTemplate;
  amountSompi: string;
  networkId: ProgrammableNetworkId;
  /** Wallet-declared template for indexer payload claims, e.g. KpxLockboxV1 */
  payloadTemplate: string;
  payloadArgs?: KaspaComPayloadArg[];
  payloadMeta?: Record<string, string>;
  /** Extra params forwarded to the wallet adapter */
  params?: Record<string, unknown>;
}

export interface CovenantSpendRequest {
  template: CovenantTemplate;
  networkId: ProgrammableNetworkId;
  functionName: string;
  spendOutpoint: KaspaComCovenantOutpoint;
  inputAmountSompi: string;
  outputs: KaspaComSpendOutput[];
  extraArgs?: Record<string, string>;
  params?: Record<string, unknown>;
}

export interface CovenantExecutionResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  covenantId?: string;
  contractAddress?: string;
  outpoint?: KaspaComCovenantOutpoint;
  indexed?: boolean;
  error?: string;
}

export type CovenantExecutionProviderId = 'wallet' | 'unavailable';

export interface CovenantExecutionProvider {
  readonly id: CovenantExecutionProviderId;
  canExecute(): Promise<boolean>;
  deploy(request: CovenantDeployRequest, compiled: KaspaComCompiledContract | null): Promise<CovenantExecutionResult>;
  spend(request: CovenantSpendRequest, compiled: KaspaComCompiledContract | null): Promise<CovenantExecutionResult>;
}
