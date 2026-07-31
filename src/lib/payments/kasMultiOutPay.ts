/**
 * Multi-output KAS payment: one atomic tx via kaspa-wasm createTransactions + wallet signPskt/pushTx.
 * Falls back to sequential sendKaspa when the wallet lacks PSKT support.
 */

import { kasToSompi } from '@/lib/ads/config';
import { loadKaspaWasm } from '@/lib/covenant/builder/kaspa-wasm';
import { loadWalletGeneratorEntries } from '@/lib/covenant/builder/utxo';
import { resolveCovenantNetworkId } from '@/lib/programmable/config';
import { formatKaspaWalletError } from '@/lib/kaspa/formatWalletError';
import { signAndBroadcastCovenantPskt } from '@/lib/kaspa/pskt-covenant';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { sendKaspaTransaction, getWalletProvider } from '@/lib/kaspa/wallet';
import {
  mergeSameAddressLegs,
  paymentPlanTotal,
  type PaymentPlan,
} from '@/lib/payments/paymentPlan';

const SIGHASH_ALL = 1;

export type KasMultiOutPayResult = {
  txHash: string;
  /** True when all legs were paid in one transaction. */
  atomic: boolean;
  /** Extra tx ids when fallback sequential path was used. */
  extraTxHashes?: string[];
};

function signInputsForCount(
  inputCount: number,
  senderAddress: string,
  publicKeyHex?: string | null,
) {
  return Array.from({ length: inputCount }, (_, index) => ({
    index,
    sighashType: SIGHASH_ALL,
    address: senderAddress,
    ...(publicKeyHex ? { publicKey: publicKeyHex } : {}),
  }));
}

async function payKasMultiOutAtomic(
  provider: KaspaWalletProvider,
  plan: PaymentPlan,
  senderAddress: string,
): Promise<KasMultiOutPayResult> {
  const merged = mergeSameAddressLegs(plan);
  const outputs = merged.legs
    .filter((leg) => leg.amount > 0)
    .map((leg) => {
      const sompi = BigInt(Math.floor(kasToSompi(leg.amount)));
      if (sompi <= 0n) throw new Error(`Invalid payment leg amount for ${leg.label ?? leg.role}`);
      return { address: leg.address, amount: sompi };
    });
  if (outputs.length === 0) throw new Error('Payment plan has no outputs');

  const wallet = getWalletProvider(provider);
  if (!wallet?.signPskt || !wallet.pushTx) {
    throw new Error('PSKT_UNAVAILABLE');
  }

  const kaspa = await loadKaspaWasm();
  const networkId = resolveCovenantNetworkId({ address: senderAddress });
  const entries = await loadWalletGeneratorEntries(provider);
  const priorityFee = 0n;
  const payload = merged.payloadHex?.trim() || undefined;

  const created = await kaspa.createTransactions({
    entries,
    outputs,
    changeAddress: senderAddress,
    priorityFee,
    networkId,
    ...(payload ? { payload } : {}),
  });

  if (!created.transactions?.length) {
    throw new Error('Wallet could not build a multi-output payment transaction');
  }

  let publicKeyHex: string | null = null;
  try {
    if (typeof wallet.getPublicKey === 'function') {
      publicKeyHex = await wallet.getPublicKey();
    }
  } catch {
    publicKeyHex = null;
  }

  const txHashes: string[] = [];
  for (const item of created.transactions) {
    const tx = item.transaction;
    const unsignedTxJson = tx.serializeToSafeJSON();
    const signed = await signAndBroadcastCovenantPskt(provider, {
      unsignedTxJson,
      signInputs: signInputsForCount(tx.inputs.length, senderAddress, publicKeyHex),
      autoFinalize: true,
    });
    if (signed.status === 'failed' || !signed.txHash) {
      throw new Error(signed.error || 'Multi-output payment signing failed');
    }
    txHashes.push(extractKaspaTransactionId(signed.txHash) ?? signed.txHash);
  }

  return {
    txHash: txHashes[txHashes.length - 1]!,
    atomic: txHashes.length === 1,
    extraTxHashes: txHashes.length > 1 ? txHashes.slice(0, -1) : undefined,
  };
}

async function payKasSequential(
  provider: KaspaWalletProvider,
  plan: PaymentPlan,
): Promise<KasMultiOutPayResult> {
  const merged = mergeSameAddressLegs(plan);
  const hashes: string[] = [];
  for (const leg of merged.legs) {
    if (!(leg.amount > 0)) continue;
    const sompi = Math.floor(kasToSompi(leg.amount));
    if (sompi <= 0) continue;
    const result = await sendKaspaTransaction(provider, {
      to: leg.address,
      amount: String(sompi),
      note: merged.note,
      payload: merged.payloadHex,
    });
    if (result.status === 'failed' || !result.txHash) {
      throw new Error(result.error || `Payment failed for ${leg.label ?? leg.role}`);
    }
    hashes.push(extractKaspaTransactionId(result.txHash) ?? result.txHash);
  }
  if (hashes.length === 0) throw new Error('No payment outputs were sent');
  return {
    txHash: hashes[0]!,
    atomic: false,
    extraTxHashes: hashes.length > 1 ? hashes.slice(1) : undefined,
  };
}

/**
 * Pay all required KAS legs. Prefers one multi-output tx; falls back to sequential sends.
 */
export async function payKasPaymentPlan(
  provider: KaspaWalletProvider,
  plan: PaymentPlan,
  senderAddress: string,
): Promise<KasMultiOutPayResult> {
  const total = paymentPlanTotal(plan);
  if (!(total > 0)) throw new Error('Payment total must be positive');

  const merged = mergeSameAddressLegs(plan);
  if (merged.legs.length === 1) {
    const leg = merged.legs[0]!;
    const sompi = Math.floor(kasToSompi(leg.amount));
    const result = await sendKaspaTransaction(provider, {
      to: leg.address,
      amount: String(sompi),
      note: merged.note,
      payload: merged.payloadHex,
    });
    if (result.status === 'failed' || !result.txHash) {
      throw new Error(result.error || 'Payment failed');
    }
    return {
      txHash: extractKaspaTransactionId(result.txHash) ?? result.txHash,
      atomic: true,
    };
  }

  try {
    return await payKasMultiOutAtomic(provider, merged, senderAddress);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'PSKT_UNAVAILABLE' || /signPskt|pushTx|PSKT/i.test(message)) {
      return payKasSequential(provider, merged);
    }
    // If WASM/build fails, try sequential so users can still complete payment.
    try {
      return await payKasSequential(provider, merged);
    } catch (fallbackErr) {
      throw new Error(
        formatKaspaWalletError(
          fallbackErr instanceof Error
            ? fallbackErr
            : new Error(message || 'Multi-output payment failed'),
        ),
      );
    }
  }
}
