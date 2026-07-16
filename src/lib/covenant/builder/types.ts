import type { CovenantCompiledContract, CovenantSignInput, CovenantTemplate } from '@/lib/programmability/types';
import type { ProgrammableNetworkId } from '@/lib/programmable/config';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

/** Result of an unsigned covenant tx build (ready for signPskt). */
export interface UnsignedCovenantTx {
  unsignedTxJson: string;
  signInputs: CovenantSignInput[];
  /** P2SH / contract address for deploy outputs */
  contractAddress?: string;
  /** Best-effort covenant id after populateGenesisCovenants (may be set after broadcast) */
  provisionalCovenantId?: string;
  /** Output index of the primary covenant UTXO (deploy) or payout (spend) */
  primaryOutputIndex?: number;
  /** Extra compound txs that must be signed+broadcast before the primary (UTXO consolidation) */
  prerequisiteTxs?: Array<{
    unsignedTxJson: string;
    signInputs: CovenantSignInput[];
  }>;
}

export interface CovenantBuilderContext {
  provider: KaspaWalletProvider;
  networkId: ProgrammableNetworkId;
  senderAddress: string;
  /** Optional public key hex for KasCoven-style toSignInputs */
  publicKeyHex?: string | null;
  computeBudget?: number;
  priorityFeeSompi?: string;
}

export interface BuildDeployInput {
  template: CovenantTemplate;
  amountSompi: string;
  compiled: CovenantCompiledContract;
  transactionPayloadHex?: string;
  ctx: CovenantBuilderContext;
}

export interface BuildSpendInput {
  template: CovenantTemplate;
  compiled: CovenantCompiledContract;
  functionName: string;
  spendOutpoint: { txid: string; vout: number };
  inputAmountSompi: string;
  outputs: Array<{ address: string; amountSompi: string; covenantId?: string }>;
  extraArgs?: Record<string, string>;
  covenantId?: string;
  ctx: CovenantBuilderContext;
}

export interface TemplateDeployBuilder {
  buildDeploy(input: BuildDeployInput): Promise<UnsignedCovenantTx>;
}

export interface TemplateSpendBuilder {
  buildSpend(input: BuildSpendInput): Promise<UnsignedCovenantTx>;
}
