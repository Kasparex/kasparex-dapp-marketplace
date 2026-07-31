/**
 * Verify that a single tx (or set of txs) paid every required payment leg.
 */

import { kasToSompi } from '@/lib/ads/config';
import { getRestTransactionById, type KaspaRestTransaction, type KaspaRestTxOutput } from '@/lib/kaspa/api';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import type { PaymentPlan } from '@/lib/payments/paymentPlan';

function normAddr(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    return a;
  }
}

function outputAddress(o: KaspaRestTxOutput): string | undefined {
  const x = o as Record<string, unknown>;
  return (
    o.script_public_key_address ??
    o.scriptPublicKeyAddress ??
    o.address ??
    (typeof x.script_public_key === 'object' &&
    x.script_public_key &&
    typeof (x.script_public_key as { address?: string }).address === 'string'
      ? (x.script_public_key as { address: string }).address
      : undefined)
  );
}

function sumOutputsToAddress(tx: KaspaRestTransaction, addressNorm: string): number {
  let sum = 0;
  for (const o of tx.outputs ?? []) {
    const addr = outputAddress(o);
    if (!addr) continue;
    try {
      if (normAddr(addr) !== addressNorm) continue;
    } catch {
      continue;
    }
    const amt = typeof o.amount === 'string' ? parseInt(o.amount, 10) : Number(o.amount ?? 0);
    if (!Number.isNaN(amt) && amt > 0) sum += amt;
  }
  return sum;
}

export async function verifyPaymentPlanTxs(args: {
  plan: PaymentPlan;
  txHashes: string[];
  /** Soft floor: accept slight underpay from mass retries (fraction of leg). Default 0.95. */
  minFraction?: number;
}): Promise<{ ok: boolean; error?: string; paidByRole?: Record<string, number> }> {
  const hashes = args.txHashes
    .map((h) => extractKaspaTransactionId(h) ?? h.trim().replace(/^0x/i, '').toLowerCase())
    .filter((h) => /^[0-9a-f]{64}$/.test(h));
  if (hashes.length === 0) return { ok: false, error: 'invalid_tx_hash' };

  const txs: KaspaRestTransaction[] = [];
  for (const hash of hashes) {
    const tx = await getRestTransactionById(hash, { maxAttempts: 8, delayMs: 350 });
    if (!tx) return { ok: false, error: 'transaction_not_found' };
    txs.push(tx);
  }

  const minFraction = args.minFraction ?? 0.95;
  const paidByRole: Record<string, number> = {};

  for (const leg of args.plan.legs) {
    if (leg.required === false) continue;
    const addr = normAddr(leg.address);
    let paidSompi = 0;
    for (const tx of txs) {
      paidSompi += sumOutputsToAddress(tx, addr);
    }
    const need = Math.floor(kasToSompi(leg.amount) * minFraction);
    paidByRole[leg.role] = paidSompi / 1e8;
    if (paidSompi < need) {
      return {
        ok: false,
        error: `insufficient_${leg.role}_payment`,
        paidByRole,
      };
    }
  }

  return { ok: true, paidByRole };
}
