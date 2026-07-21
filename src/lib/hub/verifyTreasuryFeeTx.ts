import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { getRestTransactionById, type KaspaRestTransaction, type KaspaRestTxOutput } from '@/lib/kaspa/api';
import { kasToSompi } from '@/lib/ads/config';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';

const TREASURY = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';

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

function sumOutputsToTreasury(tx: KaspaRestTransaction, treasuryNorm: string): number {
  let sum = 0;
  for (const o of tx.outputs ?? []) {
    const addr = outputAddress(o);
    if (!addr) continue;
    try {
      if (normAddr(addr) !== treasuryNorm) continue;
    } catch {
      continue;
    }
    const amt = typeof o.amount === 'string' ? parseInt(o.amount, 10) : Number(o.amount ?? 0);
    if (!Number.isNaN(amt) && amt > 0) sum += amt;
  }
  return sum;
}

function payerAddressesFromTx(tx: KaspaRestTransaction): Set<string> {
  const set = new Set<string>();
  for (const inp of tx.inputs ?? []) {
    const i = inp as Record<string, unknown>;
    const vd = i.verboseData ?? i.verbose_data;
    const fromVerbose =
      vd && typeof vd === 'object' && typeof (vd as { address?: string }).address === 'string'
        ? (vd as { address: string }).address
        : undefined;
    const a = inp.previous_outpoint_address ?? inp.previousOutpointAddress ?? fromVerbose;
    if (a && typeof a === 'string' && a.startsWith('kaspa:')) {
      try {
        set.add(normAddr(a));
      } catch {
        set.add(a);
      }
    }
  }
  return set;
}

/**
 * Verify a Hub listing fee: payer owns the tx and treasury received at least `minKas`
 * (after allowing max KREX discounts via a low floor).
 */
export async function verifyHubTreasuryFeeTx(args: {
  wallet: string;
  txHashRaw: string;
  /** Absolute minimum KAS to treasury (pre-discount floor after max tier cut). */
  minKas: number;
}): Promise<{ ok: boolean; error?: string }> {
  if (!TREASURY) {
    return { ok: false, error: 'treasury_not_configured' };
  }
  const txHash =
    extractKaspaTransactionId(args.txHashRaw) ??
    args.txHashRaw.trim().replace(/^0x/i, '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(txHash)) {
    return { ok: false, error: 'invalid_tx_hash' };
  }

  let walletNorm: string;
  let treasuryNorm: string;
  try {
    walletNorm = normAddr(args.wallet);
    treasuryNorm = normAddr(TREASURY);
  } catch {
    return { ok: false, error: 'invalid_address' };
  }

  const tx = await getRestTransactionById(txHash, { maxAttempts: 8, delayMs: 350 });
  if (!tx) {
    return { ok: false, error: 'transaction_not_found' };
  }

  const payers = payerAddressesFromTx(tx);
  if (!payers.has(walletNorm)) {
    return { ok: false, error: 'payer_mismatch' };
  }

  const paid = sumOutputsToTreasury(tx, treasuryNorm);
  const minSompi = Math.floor(kasToSompi(Math.max(0.05, args.minKas)));
  if (paid < minSompi) {
    return { ok: false, error: 'insufficient_treasury_payment' };
  }

  return { ok: true };
}
