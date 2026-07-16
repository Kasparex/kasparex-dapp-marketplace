/**
 * Unsigned covenant spend/claim builder (KasCoven / KaspaCom spendContract shape).
 *
 * Builds Safe-JSON with:
 * - input 0 = covenant P2SH UTXO
 * - optional wallet fee inputs + change
 * - spendAuth metadata so submit can ABI-wrap after wallet signs the redeem
 */

import type { CovenantSignInput } from '@/lib/programmability/types';
import type { UnsignedCovenantTx, BuildSpendInput } from './types';
import { getCovenantP2shAddress, hexToBytes, scriptArrayToBytes } from './address';
import { loadKaspaWasm, type KaspaWasmTransaction } from './kaspa-wasm';
import { loadWalletGeneratorEntries } from './utxo';
import {
  buildSigScript,
  bytesToHex,
  encodeP2shUnlockScript,
  redeemScriptBytes,
  toXOnlyPubkeyBytes,
  type AbiCompiledLike,
  type AbiFunctionArg,
} from './abi-sigscript';
import { resolveCovenantNetworkId } from '@/lib/programmable/config';

const DEFAULT_COMPUTE_BUDGET = 10;
const SIGHASH_ALL = 1;
const DUMMY_SIGNATURE_BYTES = new Uint8Array(65);
const MINIMAL_CHANGE_SOMPI = 1000n;

function toCompiledLike(compiled: BuildSpendInput['compiled']): AbiCompiledLike {
  return {
    abi: compiled.abi ?? [],
    without_selector: compiled.without_selector ?? true,
    script: Array.isArray(compiled.script) ? compiled.script : undefined,
    scriptHex: (compiled as { scriptHex?: string }).scriptHex,
  };
}

function resolveFunctionArgs(
  compiled: AbiCompiledLike,
  functionName: string,
  signature: Uint8Array,
  xOnlyPubkey: Uint8Array,
  extraArgs?: Record<string, string>,
): AbiFunctionArg[] {
  const entry = compiled.abi.find((e) => e.name === functionName);
  if (!entry) throw new Error(`Function "${functionName}" not found in compiled ABI`);

  return entry.inputs.map((input) => {
    if (input.type_name === 'sig') return signature;
    if (input.type_name === 'pubkey') {
      const raw = extraArgs?.[input.name];
      if (raw) return toXOnlyPubkeyBytes(raw);
      return xOnlyPubkey;
    }
    if (input.type_name === 'int' || input.type_name === 'bool') {
      const raw = extraArgs?.[input.name];
      if (raw === undefined) {
        throw new Error(
          `Function "${functionName}" requires "${input.name}:${input.type_name}" via extraArgs`,
        );
      }
      if (input.type_name === 'bool') {
        return BigInt(raw === '1' || raw.toLowerCase() === 'true' ? 1 : 0);
      }
      return BigInt(raw);
    }
    if (input.type_name === 'byte' || /^byte\[\d+\]$/.test(input.type_name)) {
      const raw = extraArgs?.[input.name];
      if (!raw) {
        throw new Error(
          `Function "${functionName}" requires "${input.name}:${input.type_name}" via extraArgs`,
        );
      }
      return hexToBytes(raw);
    }
    throw new Error(
      `Unsupported ABI type "${input.type_name}" for spend of "${functionName}"`,
    );
  });
}

async function applyEstimatedSignatureScripts(
  tx: KaspaWasmTransaction,
  compiled: AbiCompiledLike,
  functionName: string,
  xOnlyPubkey: Uint8Array,
  extraArgs?: Record<string, string>,
): Promise<void> {
  const kaspa = await loadKaspaWasm();
  const functionArgs = resolveFunctionArgs(
    compiled,
    functionName,
    DUMMY_SIGNATURE_BYTES,
    xOnlyPubkey,
    extraArgs,
  );
  const sigPrefix = await buildSigScript(compiled, functionName, functionArgs);
  const redeem = redeemScriptBytes(compiled);
  tx.inputs[0].signatureScript = await encodeP2shUnlockScript(redeem, sigPrefix);

  for (let i = 1; i < tx.inputs.length; i++) {
    tx.inputs[i].signatureScript = new kaspa.ScriptBuilder()
      .addData(DUMMY_SIGNATURE_BYTES)
      .drain();
  }
}

function clearSignatureScripts(tx: KaspaWasmTransaction): void {
  for (const input of tx.inputs) {
    input.signatureScript = '';
  }
}

function feeSignInputs(
  inputCount: number,
  senderAddress: string,
  publicKeyHex?: string | null,
): CovenantSignInput[] {
  const out: CovenantSignInput[] = [];
  for (let index = 1; index < inputCount; index++) {
    out.push({
      index,
      sighashType: SIGHASH_ALL,
      address: senderAddress,
      ...(publicKeyHex ? { publicKey: publicKeyHex } : {}),
    });
  }
  return out;
}

function sumOutputValues(tx: KaspaWasmTransaction): bigint {
  return tx.outputs.reduce((sum, o) => sum + BigInt(o.value ?? 0), 0n);
}

function sumInputAmounts(tx: KaspaWasmTransaction): bigint {
  return tx.inputs.reduce((sum, input) => {
    const amount = input.utxo?.amount;
    return sum + (amount !== undefined ? BigInt(amount) : 0n);
  }, 0n);
}

/**
 * Generic P2SH covenant spend: covenant UTXO (+ wallet fee UTXOs) → outputs.
 * Wallet later signs redeem (input 0) then fee inputs; Hub wraps ABI unlock.
 */
export async function buildGenericUnsignedSpend(
  input: BuildSpendInput,
): Promise<UnsignedCovenantTx> {
  const { compiled, functionName, spendOutpoint, inputAmountSompi, outputs, ctx, extraArgs } =
    input;

  const compiledLike = toCompiledLike(compiled);
  if (!compiledLike.abi.length) {
    throw new Error(`Compiled ABI missing for template "${input.template}"`);
  }
  const abiEntry = compiledLike.abi.find((e) => e.name === functionName);
  if (!abiEntry) {
    throw new Error(`Function "${functionName}" not found in compiled ABI`);
  }

  const redeem = Array.isArray(compiled.script)
    ? scriptArrayToBytes(compiled.script)
    : redeemScriptBytes(compiledLike);
  if (redeem.length === 0) {
    throw new Error(`Compiled script missing for template "${input.template}"`);
  }

  const kaspa = await loadKaspaWasm();
  const networkId = resolveCovenantNetworkId({
    address: ctx.senderAddress,
    networkId: ctx.networkId,
  });
  const contractAddress = await getCovenantP2shAddress(Array.from(redeem), networkId);
  const p2shSpk = kaspa.payToScriptHashScript(redeem);
  const covenantAmount = BigInt(inputAmountSompi);
  if (covenantAmount <= 0n) throw new Error('Spend input amount must be positive');

  const publicKeyHex = ctx.publicKeyHex?.trim() || null;
  if (!publicKeyHex) {
    throw new Error(
      'Wallet public key is required for covenant claim/spend (getPublicKey). Update KasWare / Kastle.',
    );
  }
  const xOnlyPubkey = toXOnlyPubkeyBytes(publicKeyHex);

  const walletEntries = await loadWalletGeneratorEntries(ctx.provider);
  const computeBudget = ctx.computeBudget ?? DEFAULT_COMPUTE_BUDGET;
  const priorityFee = BigInt(ctx.priorityFeeSompi ?? '0');

  const covenantEntry: Record<string, unknown> = {
    address: contractAddress,
    amount: covenantAmount,
    outpoint: {
      transactionId: spendOutpoint.txid,
      index: spendOutpoint.vout,
    },
    scriptPublicKey: p2shSpk,
    blockDaaScore: 0n,
    isCoinbase: false,
  };
  if (input.covenantId) {
    covenantEntry.covenantId = input.covenantId;
  }

  const paymentOutputs = outputs.map((o) => ({
    address: o.address,
    amount: BigInt(o.amountSompi),
  }));
  if (paymentOutputs.length === 0) {
    throw new Error('Spend requires at least one output');
  }

  // Prefer generator + priorityEntries so fee UTXO selection matches deploy.
  const created = await kaspa.createTransactions({
    version: 1,
    entries: walletEntries,
    priorityEntries: [covenantEntry],
    outputs: paymentOutputs,
    changeAddress: ctx.senderAddress,
    priorityFee,
    networkId,
  });

  if (!created.transactions?.length) {
    throw new Error('createTransactions returned no spend transactions');
  }

  const prerequisiteTxs: UnsignedCovenantTx['prerequisiteTxs'] = [];
  const lastIdx = created.transactions.length - 1;

  for (let i = 0; i < lastIdx; i++) {
    const compound = created.transactions[i].transaction;
    compound.version = 1;
    for (const cin of compound.inputs) {
      cin.sigOpCount = 0;
      cin.computeBudget = computeBudget;
    }
    compound.finalize();
    prerequisiteTxs.push({
      unsignedTxJson: compound.serializeToSafeJSON(),
      signInputs: Array.from({ length: compound.inputs.length }, (_, index) => ({
        index,
        sighashType: SIGHASH_ALL,
        address: ctx.senderAddress,
        ...(publicKeyHex ? { publicKey: publicKeyHex } : {}),
      })),
    });
  }

  const tx = created.transactions[lastIdx].transaction;
  tx.version = 1;
  for (const tin of tx.inputs) {
    tin.sigOpCount = 0;
    tin.computeBudget = computeBudget;
  }

  // lockTime: optional override; lockbox unlock_at=0 does not require tx.time
  const lockTimeRaw = extraArgs?.lockTime;
  if (lockTimeRaw) {
    tx.lockTime = BigInt(lockTimeRaw);
  }

  tx.finalize();

  await applyEstimatedSignatureScripts(
    tx,
    compiledLike,
    functionName,
    xOnlyPubkey,
    extraArgs,
  );

  const networkFee = kaspa.calculateTransactionFee(networkId, tx) ?? 0n;
  const totalFees = networkFee + priorityFee;
  const inputSum = sumInputAmounts(tx);
  const outputSum = sumOutputValues(tx);
  const currentFee = inputSum - outputSum;

  if (totalFees > currentFee) {
    const shortfall = totalFees - currentFee;
    // Prefer shrinking change (last output matching sender), else last payment output.
    let adjusted = false;
    for (let i = tx.outputs.length - 1; i >= 0; i--) {
      const out = tx.outputs[i];
      if (out.value > shortfall + MINIMAL_CHANGE_SOMPI) {
        out.value = out.value - shortfall;
        adjusted = true;
        break;
      }
    }
    if (!adjusted) {
      throw new Error(
        `Insufficient funds for covenant spend fee (${totalFees} sompi). Add KAS for fees in the connected wallet.`,
      );
    }
  }

  clearSignatureScripts(tx);
  tx.finalize();

  // Ensure input 0 is the covenant outpoint (priorityEntries should place it first).
  const serialized = JSON.parse(tx.serializeToSafeJSON()) as {
    inputs?: Array<{ previousOutpoint?: { transactionId?: string; index?: number } }>;
  };
  const first = serialized.inputs?.[0]?.previousOutpoint;
  if (
    !first ||
    first.transactionId !== spendOutpoint.txid ||
    Number(first.index) !== spendOutpoint.vout
  ) {
    throw new Error(
      'Spend builder did not place the covenant UTXO at input 0. Try consolidating wallet UTXOs and claim again.',
    );
  }

  return {
    unsignedTxJson: tx.serializeToSafeJSON(),
    signInputs: feeSignInputs(tx.inputs.length, ctx.senderAddress, publicKeyHex),
    contractAddress,
    primaryOutputIndex: 0,
    prerequisiteTxs: prerequisiteTxs.length ? prerequisiteTxs : undefined,
    spendAuth: {
      covenantInputIndex: 0,
      redeemScriptHex: bytesToHex(redeem),
      functionName,
      withoutSelector: Boolean(compiledLike.without_selector),
      abiInputs: abiEntry.inputs.map((i) => ({
        name: i.name,
        type_name: i.type_name,
      })),
      extraArgs,
    },
  };
}

/** Apply real ABI P2SH unlock to input 0 after wallet produces a redeem signature. */
export async function finalizeSpendAuthSignatureScript(
  signedOrPartialTxJson: string,
  spendAuth: NonNullable<UnsignedCovenantTx['spendAuth']>,
  publicKeyHex: string,
  rawSignature?: Uint8Array | string,
): Promise<string> {
  const {
    extractSchnorrSigFromSignatureScript,
    normalizeSchnorrSignature,
  } = await import('./abi-sigscript');

  let signature: Uint8Array;
  if (rawSignature) {
    signature = normalizeSchnorrSignature(rawSignature);
  } else {
    const parsed = JSON.parse(signedOrPartialTxJson) as {
      inputs?: Array<{ signatureScript?: string }>;
    };
    const sigScript = parsed.inputs?.[spendAuth.covenantInputIndex]?.signatureScript;
    if (!sigScript) {
      throw new Error(
        'Wallet did not return a signatureScript for the covenant input. Ensure signPskt supports scripts/redeem signing.',
      );
    }
    signature = extractSchnorrSigFromSignatureScript(sigScript);
  }

  const compiledLike: AbiCompiledLike = {
    abi: [{ name: spendAuth.functionName, inputs: spendAuth.abiInputs }],
    without_selector: spendAuth.withoutSelector,
    scriptHex: spendAuth.redeemScriptHex,
  };
  const xOnly = toXOnlyPubkeyBytes(publicKeyHex);
  const args = resolveFunctionArgs(
    compiledLike,
    spendAuth.functionName,
    signature,
    xOnly,
    spendAuth.extraArgs,
  );
  const sigPrefix = await buildSigScript(compiledLike, spendAuth.functionName, args);
  const unlock = await encodeP2shUnlockScript(
    hexToBytes(spendAuth.redeemScriptHex),
    sigPrefix,
  );

  try {
    const kaspa = await loadKaspaWasm();
    const tx = kaspa.Transaction.deserializeFromSafeJSON(signedOrPartialTxJson);
    tx.inputs[spendAuth.covenantInputIndex].signatureScript = unlock;
    return tx.serializeToSafeJSON();
  } catch {
    const parsed = JSON.parse(signedOrPartialTxJson) as {
      inputs: Array<{ signatureScript?: string }>;
    };
    parsed.inputs[spendAuth.covenantInputIndex].signatureScript = unlock;
    return JSON.stringify(parsed);
  }
}
