import type { CovenantSignInput } from '@/lib/programmability/types';
import type { UnsignedCovenantTx, BuildDeployInput } from './types';
import { getCovenantP2shAddress, payloadHexToBytes, scriptArrayToBytes, hexToBytes } from './address';
import { loadKaspaWasm, type KaspaWasmTransaction } from './kaspa-wasm';
import { loadWalletGeneratorEntries } from './utxo';
import { resolveCovenantNetworkId } from '@/lib/programmable/config';

const DEFAULT_COMPUTE_BUDGET = 10;
const SIGHASH_ALL = 1;

function findOutputIndexByAddress(
  serialized: { outputs?: Array<{ scriptPublicKey?: unknown; value?: unknown }> },
  contractAddress: string,
  networkId: string,
): number {
  // Prefer reading covenant binding after serialize; address matching is best-effort via JSON fields.
  const outputs = serialized.outputs ?? [];
  for (let i = 0; i < outputs.length; i++) {
    const o = outputs[i] as Record<string, unknown>;
    const addr =
      (o.verboseData as { scriptPublicKeyType?: string; scriptPublicKeyAddress?: string } | undefined)
        ?.scriptPublicKeyAddress ??
      (o as { address?: string }).address;
    if (typeof addr === 'string' && addr === contractAddress) return i;
  }
  // Fallback: first non-change output is usually index 0 for simple deploys.
  if (outputs.length > 0) return 0;
  void networkId;
  return -1;
}

function signInputsForTx(
  inputCount: number,
  senderAddress: string,
  publicKeyHex?: string | null,
): CovenantSignInput[] {
  return Array.from({ length: inputCount }, (_, index) => ({
    index,
    sighashType: SIGHASH_ALL,
    address: senderAddress,
    ...(publicKeyHex ? { publicKey: publicKeyHex } : {}),
  }));
}

function prepareV1GenesisTx(
  tx: KaspaWasmTransaction,
  covenantOutputIdx: number,
  computeBudget: number,
): void {
  tx.version = 1;
  for (const input of tx.inputs) {
    input.sigOpCount = 0;
    input.computeBudget = computeBudget;
  }
  tx.populateGenesisCovenants([
    { authorizingInput: 0, outputs: [covenantOutputIdx] },
  ]);
  tx.finalize();
}

/**
 * Generic P2SH covenant deploy: fund compiled script with KIP-20 genesis binding.
 * Works for any template that ships `compiled.script` / scriptHex (lockbox, split, …).
 */
export async function buildGenericUnsignedDeploy(
  input: BuildDeployInput,
): Promise<UnsignedCovenantTx> {
  const { compiled, amountSompi, ctx, transactionPayloadHex } = input;
  const amount = BigInt(amountSompi);
  if (amount <= 0n) throw new Error('Deploy amount must be positive');

  const scriptBytes = Array.isArray(compiled.script)
    ? scriptArrayToBytes(compiled.script)
    : hexToBytes(String((compiled as { scriptHex?: string }).scriptHex ?? ''));
  if (scriptBytes.length === 0) {
    throw new Error(`Compiled script missing for template "${input.template}"`);
  }

  const kaspa = await loadKaspaWasm();
  // Never let a stale testnet default fight a mainnet kaspa: change address.
  const networkId = resolveCovenantNetworkId({
    address: ctx.senderAddress,
    networkId: ctx.networkId,
  });
  const contractAddress = await getCovenantP2shAddress(Array.from(scriptBytes), networkId);
  const entries = await loadWalletGeneratorEntries(ctx.provider);
  const payload = payloadHexToBytes(transactionPayloadHex);
  const computeBudget = ctx.computeBudget ?? DEFAULT_COMPUTE_BUDGET;
  const priorityFee = BigInt(ctx.priorityFeeSompi ?? '0');

  const created = await kaspa.createTransactions({
    version: 1,
    entries,
    outputs: [{ address: contractAddress, amount }],
    changeAddress: ctx.senderAddress,
    priorityFee,
    networkId,
    ...(payload ? { payload } : {}),
  });

  if (!created.transactions?.length) {
    throw new Error('createTransactions returned no transactions');
  }

  const prerequisiteTxs: UnsignedCovenantTx['prerequisiteTxs'] = [];
  const lastIdx = created.transactions.length - 1;

  for (let i = 0; i < lastIdx; i++) {
    const compound = created.transactions[i].transaction;
    compound.version = 1;
    for (const input of compound.inputs) {
      input.sigOpCount = 0;
      input.computeBudget = computeBudget;
    }
    compound.finalize();
    prerequisiteTxs.push({
      unsignedTxJson: compound.serializeToSafeJSON(),
      signInputs: signInputsForTx(compound.inputs.length, ctx.senderAddress, ctx.publicKeyHex),
    });
  }

  const tx = created.transactions[lastIdx].transaction;
  tx.version = 1;
  for (const input of tx.inputs) {
    input.sigOpCount = 0;
    input.computeBudget = computeBudget;
  }

  // createTransactions places the payment output first; change follows when needed.
  const covenantOutputIdx = 0;
  try {
    prepareV1GenesisTx(tx, covenantOutputIdx, computeBudget);
  } catch (err) {
    throw new Error(
      `Covenant genesis binding failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const serialized = JSON.parse(tx.serializeToSafeJSON()) as {
    outputs?: Array<Record<string, unknown>>;
  };
  const matchedIdx = findOutputIndexByAddress(serialized, contractAddress, networkId);
  const outputIdx = matchedIdx >= 0 ? matchedIdx : covenantOutputIdx;
  const covenant = serialized.outputs?.[outputIdx]?.covenant as
    | { covenantId?: string }
    | undefined;

  return {
    unsignedTxJson: tx.serializeToSafeJSON(),
    signInputs: signInputsForTx(tx.inputs.length, ctx.senderAddress, ctx.publicKeyHex),
    contractAddress,
    provisionalCovenantId: covenant?.covenantId ? String(covenant.covenantId) : undefined,
    primaryOutputIndex: outputIdx,
    prerequisiteTxs: prerequisiteTxs.length ? prerequisiteTxs : undefined,
  };
}
