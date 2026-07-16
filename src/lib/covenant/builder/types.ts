import type { CovenantCompiledContract, CovenantSignInput, CovenantTemplate } from '@/lib/programmability/types';
import type { ProgrammableNetworkId } from '@/lib/programmable/config';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

/**
 * Spend/claim auth that the wallet cannot assemble alone.
 * Hub asks the wallet to sign input 0 with the redeem script, then wraps
 * the raw schnorr sig into a SilverScript ABI P2SH unlock.
 */
export interface SpendAuthMeta {
  covenantInputIndex: number;
  redeemScriptHex: string;
  functionName: string;
  withoutSelector: boolean;
  abiInputs: Array<{ name: string; type_name: string }>;
  extraArgs?: Record<string, string>;
}

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
  /** Present for spend/claim: finalize ABI sigscript after wallet signs the redeem. */
  spendAuth?: SpendAuthMeta;
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
