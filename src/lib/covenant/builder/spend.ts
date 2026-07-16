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
/** Fee UTXO budget so claim fees do not consume the covenant amount. */
const FEE_UTXO_TARGET_SOMPI = 2_000_000n;
/**
 * P2SH ABI unlocks have high compute mass. A 250k sompi floor was rejected
 * on mainnet (needed ~332k for mass 3320). Keep a safer reserve + margin.
 */
const MIN_SPEND_FEE_SOMPI = 400_000n;
const FEE_SAFETY_MARGIN_SOMPI = 50_000n;
/** Kaspa minimum relay feerate used when mass is known but fee calc is unavailable. */
const SOMPI_PER_MASS_UNIT = 100n;

function normTxid(id: string): string {
  return id.trim().toLowerCase().replace(/^0x/i, '');
}

type SerializedInputOutpoint = {
  transactionId?: string;
  index?: number | string;
  previousOutpoint?: { transactionId?: string; index?: number | string };
};

/** SafeJSON flattens outpoints to `{ transactionId, index }`; runtime objects nest `previousOutpoint`. */
function readInputOutpoint(input: SerializedInputOutpoint | undefined): {
  transactionId: string;
  index: number;
} | null {
  if (!input) return null;
  const nested = input.previousOutpoint;
  const transactionId = String(
    nested?.transactionId ?? input.transactionId ?? '',
  );
  if (!transactionId) return null;
  const index = Number(nested?.index ?? input.index ?? 0);
  return { transactionId, index };
}

function outpointMatches(
  input: SerializedInputOutpoint | undefined,
  spendOutpoint: { txid: string; vout: number },
): boolean {
  const op = readInputOutpoint(input);
  if (!op) return false;
  return (
    normTxid(op.transactionId) === normTxid(spendOutpoint.txid) &&
    Number(op.index) === Number(spendOutpoint.vout)
  );
}

function entryAmount(entry: Record<string, unknown>): bigint {
  const raw = entry.amount;
  if (typeof raw === 'bigint') return raw;
  return BigInt(String(raw ?? '0'));
}

function entryOutpoint(entry: Record<string, unknown>): { txid: string; vout: number } | null {
  const out =
    (entry.outpoint as Record<string, unknown> | undefined) ??
    (entry.previousOutpoint as Record<string, unknown> | undefined);
  if (!out) return null;
  const txid = String(out.transactionId ?? out.transaction_id ?? out.txId ?? out.txid ?? '');
  if (!txid) return null;
  return { txid: normTxid(txid), vout: Number(out.index ?? out.vout ?? 0) };
}

/** Prefer one solid fee UTXO, else accumulate a few until the fee budget is met. */
function selectFeeEntries(
  walletEntries: Record<string, unknown>[],
  spendOutpoint: { txid: string; vout: number },
  targetSompi: bigint,
): Record<string, unknown>[] {
  const usable = walletEntries.filter((entry) => {
    const op = entryOutpoint(entry);
    if (!op) return false;
    if (op.txid === normTxid(spendOutpoint.txid) && op.vout === spendOutpoint.vout) return false;
    return entryAmount(entry) > 0n;
  });
  if (usable.length === 0) {
    throw new Error(
      'No spendable KAS UTXOs for claim fees. Keep a small amount of unlocked KAS in this wallet.',
    );
  }

  const single = usable
    .filter((e) => entryAmount(e) >= targetSompi)
    .sort((a, b) => Number(entryAmount(a) - entryAmount(b)))[0];
  if (single) return [single];

  const sorted = [...usable].sort((a, b) => Number(entryAmount(b) - entryAmount(a)));
  const picked: Record<string, unknown>[] = [];
  let sum = 0n;
  for (const entry of sorted) {
    picked.push(entry);
    sum += entryAmount(entry);
    if (sum >= targetSompi || picked.length >= 4) break;
  }
  if (sum < MINIMAL_CHANGE_SOMPI) {
    throw new Error(
      'Not enough unlocked KAS for claim network fees. Add a small amount of KAS and try again.',
    );
  }
  return picked;
}

function findCovenantInputIndex(
  serialized: { inputs?: SerializedInputOutpoint[] },
  spendOutpoint: { txid: string; vout: number },
): number {
  const inputs = serialized.inputs ?? [];
  return inputs.findIndex((input) => outpointMatches(input, spendOutpoint));
}

/** Move the covenant outpoint to input 0 when the generator left it elsewhere. */
function ensureCovenantAtInputZero(
  tx: KaspaWasmTransaction,
  spendOutpoint: { txid: string; vout: number },
  kaspa: Awaited<ReturnType<typeof loadKaspaWasm>>,
): KaspaWasmTransaction {
  const serialized = JSON.parse(tx.serializeToSafeJSON()) as {
    inputs?: SerializedInputOutpoint[];
  };
  const idx = findCovenantInputIndex(serialized, spendOutpoint);
  if (idx === 0) return tx;
  if (idx < 0 || !serialized.inputs) {
    const sample = (serialized.inputs ?? [])
      .slice(0, 3)
      .map((input, i) => {
        const op = readInputOutpoint(input);
        return op ? `#${i}=${normTxid(op.transactionId).slice(0, 8)}…:${op.index}` : `#${i}=?`;
      })
      .join(', ');
    throw new Error(
      `Spend builder could not include the covenant UTXO (${normTxid(spendOutpoint.txid).slice(0, 8)}…:${spendOutpoint.vout}${sample ? `; saw ${sample}` : ''}). Refresh the vault and claim again.`,
    );
  }
  const [covenantInput] = serialized.inputs.splice(idx, 1);
  serialized.inputs.unshift(covenantInput);
  const rebuilt = kaspa.Transaction.deserializeFromSafeJSON(JSON.stringify(serialized));
  rebuilt.finalize();
  return rebuilt;
}

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

function maxBigint(...values: bigint[]): bigint {
  return values.reduce((a, b) => (a > b ? a : b), 0n);
}

/**
 * Fee must cover the final ABI unlock mass. Estimate with dummy sigscripts,
 * then take the max of WASM fee, mass×feerate, and a hard floor + margin.
 */
function resolveRequiredSpendFee(
  kaspa: Awaited<ReturnType<typeof loadKaspaWasm>>,
  networkId: string,
  tx: KaspaWasmTransaction,
  priorityFee: bigint,
): bigint {
  let networkFee = 0n;
  try {
    networkFee = kaspa.calculateTransactionFee(networkId, tx) ?? 0n;
  } catch {
    networkFee = 0n;
  }

  let massFee = 0n;
  if (typeof kaspa.calculateTransactionMass === 'function') {
    try {
      const mass = kaspa.calculateTransactionMass(networkId, tx);
      massFee = BigInt(mass) * SOMPI_PER_MASS_UNIT;
    } catch {
      massFee = 0n;
    }
  }

  return maxBigint(networkFee, massFee, MIN_SPEND_FEE_SOMPI) + priorityFee + FEE_SAFETY_MARGIN_SOMPI;
}

function shrinkOutputsForFee(tx: KaspaWasmTransaction, shortfall: bigint): void {
  for (let i = tx.outputs.length - 1; i >= 0; i--) {
    const out = tx.outputs[i];
    if (out.value > shortfall + MINIMAL_CHANGE_SOMPI) {
      out.value = out.value - shortfall;
      return;
    }
  }
  throw new Error(
    `Insufficient funds for covenant spend fee (${shortfall} sompi short). Add unlocked KAS for fees and try again.`,
  );
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
      transactionId: normTxid(spendOutpoint.txid),
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
  const paymentSum = paymentOutputs.reduce((s, o) => s + o.amount, 0n);
  if (paymentSum > covenantAmount) {
    throw new Error('Spend outputs exceed the locked covenant amount');
  }

  // Ordered createTransaction keeps the covenant at input 0 and avoids
  // Generator mass-chaining that can sweep priorityEntries into a compound tx.
  const feeEntries = selectFeeEntries(walletEntries, spendOutpoint, FEE_UTXO_TARGET_SOMPI);
  const feeInputSum = feeEntries.reduce((s, e) => s + entryAmount(e), 0n);
  // Reserve enough for ABI unlock compute mass; leftover returns as change.
  const feeHeadroom = MIN_SPEND_FEE_SOMPI + FEE_SAFETY_MARGIN_SOMPI + priorityFee;
  let changeAmount = feeInputSum + (covenantAmount - paymentSum) - feeHeadroom;
  if (changeAmount < MINIMAL_CHANGE_SOMPI) changeAmount = 0n;

  const spendOutputs = [
    ...paymentOutputs,
    ...(changeAmount > 0n ? [{ address: ctx.senderAddress, amount: changeAmount }] : []),
  ];

  let tx = kaspa.createTransaction(
    [covenantEntry, ...feeEntries],
    spendOutputs,
    priorityFee,
  );

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
  tx = ensureCovenantAtInputZero(tx, spendOutpoint, kaspa);

  await applyEstimatedSignatureScripts(
    tx,
    compiledLike,
    functionName,
    xOnlyPubkey,
    extraArgs,
  );

  // Size fee against estimated ABI unlock scripts (final claim scripts are similar mass).
  let totalFees = resolveRequiredSpendFee(kaspa, networkId, tx, priorityFee);
  let inputSum = sumInputAmounts(tx);
  let outputSum = sumOutputValues(tx);
  let currentFee = inputSum - outputSum;

  if (totalFees > currentFee) {
    shrinkOutputsForFee(tx, totalFees - currentFee);
  }

  // Re-check after shrink: mass can shift slightly when change size changes.
  await applyEstimatedSignatureScripts(
    tx,
    compiledLike,
    functionName,
    xOnlyPubkey,
    extraArgs,
  );
  totalFees = resolveRequiredSpendFee(kaspa, networkId, tx, priorityFee);
  inputSum = sumInputAmounts(tx);
  outputSum = sumOutputValues(tx);
  currentFee = inputSum - outputSum;
  if (totalFees > currentFee) {
    shrinkOutputsForFee(tx, totalFees - currentFee);
  }

  clearSignatureScripts(tx);
  tx.finalize();
  tx = ensureCovenantAtInputZero(tx, spendOutpoint, kaspa);

  const serialized = JSON.parse(tx.serializeToSafeJSON()) as {
    inputs?: SerializedInputOutpoint[];
  };
  if (findCovenantInputIndex(serialized, spendOutpoint) !== 0) {
    throw new Error(
      'Spend builder did not place the covenant UTXO at input 0. Try again with a small unlocked KAS balance for fees.',
    );
  }

  // Final sanity: fee still present after clears (scripts do not change value delta).
  const finalFee = sumInputAmounts(tx) - sumOutputValues(tx);
  if (finalFee < MIN_SPEND_FEE_SOMPI) {
    throw new Error(
      `Claim fee too low (${finalFee} sompi). Keep a little unlocked KAS for network fees and try again.`,
    );
  }

  return {
    unsignedTxJson: tx.serializeToSafeJSON(),
    signInputs: feeSignInputs(tx.inputs.length, ctx.senderAddress, publicKeyHex),
    contractAddress,
    primaryOutputIndex: 0,
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
