import { kasToSompi } from '@/lib/ads/config';
import { getRestTransactionById, type KaspaRestTransaction, type KaspaRestTxOutput } from '@/lib/kaspa/api';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import type { CovenantTemplate } from '@/lib/programmability/types';
import { getKpxCovenantTreasuryAddress } from './kpxCovenantPricing';
import { KPX_COVENANT_PAYLOAD_TEMPLATES } from './kpxBranding';

export type VerifyKpxCovenantFeeInput = {
  template: CovenantTemplate;
  payerAddress: string;
  feeTxHash: string;
  requiredFeeKas: number;
};

export type VerifyKpxCovenantFeeResult = { ok: true } | { ok: false; error: string };

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

function txPaysAddressSompi(tx: KaspaRestTransaction, targetNorm: string): number {
  let paid = 0;
  for (const o of tx.outputs ?? []) {
    const addr = outputAddress(o);
    if (!addr) continue;
    try {
      if (normalizeKaspaAddress(addr) !== targetNorm) continue;
    } catch {
      continue;
    }
    const amt = typeof o.amount === 'string' ? parseInt(o.amount, 10) : Number(o.amount ?? 0);
    if (!Number.isNaN(amt) && amt > 0) paid += amt;
  }
  return paid;
}

function peelHexPayload(payload: string | null | undefined): string {
  if (!payload) return '';
  let cur = payload.replace(/^0x/i, '').trim();
  for (let i = 0; i < 3; i++) {
    if (!/^[0-9a-fA-F]+$/.test(cur) || cur.length % 2 !== 0) break;
    try {
      const text = Buffer.from(cur, 'hex').toString('utf8');
      if (!text) break;
      cur = text;
    } catch {
      break;
    }
  }
  return cur;
}

function txPayload(tx: KaspaRestTransaction): string {
  const raw =
    tx.payload ??
    (tx as Record<string, unknown>).transaction_payload ??
    (tx as Record<string, unknown>).transactionPayload;
  return peelHexPayload(typeof raw === 'string' ? raw : '');
}

export async function verifyKpxCovenantPlatformFeeTx(
  input: VerifyKpxCovenantFeeInput,
): Promise<VerifyKpxCovenantFeeResult> {
  const txid = input.feeTxHash.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(txid)) {
    return { ok: false, error: 'Invalid fee transaction hash' };
  }

  let treasuryNorm: string;
  try {
    treasuryNorm = normalizeKaspaAddress(getKpxCovenantTreasuryAddress());
  } catch {
    return { ok: false, error: 'Treasury not configured' };
  }

  let payerNorm: string;
  try {
    payerNorm = normalizeKaspaAddress(input.payerAddress);
  } catch {
    return { ok: false, error: 'Invalid payer address' };
  }

  const tx = await getRestTransactionById(txid);
  if (!tx) return { ok: false, error: 'Transaction not found' };

  void payerNorm;

  const paidSompi = txPaysAddressSompi(tx, treasuryNorm);
  const requiredSompi = kasToSompi(input.requiredFeeKas);
  if (paidSompi < requiredSompi) {
    return { ok: false, error: 'Fee amount below required platform fee' };
  }

  const payloadTemplate = KPX_COVENANT_PAYLOAD_TEMPLATES[input.template];
  const note = txPayload(tx);
  if (!note.includes('kpx-covenant') || !note.includes(payloadTemplate)) {
    return { ok: false, error: 'Transaction payload does not match KPX covenant fee' };
  }

  return { ok: true };
}
