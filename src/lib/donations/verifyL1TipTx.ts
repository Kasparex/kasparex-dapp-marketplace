import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { getRestTransactionById, type KaspaRestTransaction, type KaspaRestTxOutput } from '@/lib/kaspa/api';
import { kasToSompi } from '@/lib/ads/config';
import { parseDonationsL1TipPayload } from '@/lib/donations/l1TipPayload';

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

function sumOutputsToAddress(tx: KaspaRestTransaction, targetNorm: string): number {
  let sum = 0;
  for (const o of tx.outputs ?? []) {
    const addr = outputAddress(o);
    if (!addr) continue;
    try {
      if (normAddr(addr) !== targetNorm) continue;
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

function getTxPayload(tx: KaspaRestTransaction): string | null | undefined {
  const p = tx.payload;
  if (typeof p === 'string' && p.length > 0) return p;
  const t = tx as Record<string, unknown>;
  const vd = t.verboseData ?? t.verbose_data;
  if (vd && typeof vd === 'object' && typeof (vd as { payload?: string }).payload === 'string') {
    const vp = (vd as { payload: string }).payload;
    if (vp.length > 0) return vp;
  }
  return undefined;
}

export type VerifyL1CrowdKasTipInput = {
  txHash: string;
  campaignId: string;
  donorL2: `0x${string}`;
  /** Creator’s Kaspa address from on-chain campaign (must receive the tip). */
  tipToKaspaAddress: string;
  /** Minimum KAS sent (client-chosen amount). */
  minAmountKas: number;
  /** Kaspa address of the connected L1 wallet that sent the tip. */
  payerKaspaAddress: string;
};

export type VerifyL1CrowdKasTipResult = { ok: true; paidSompi: number } | { ok: false; error: string };

export async function verifyL1CrowdKasTipTx(input: VerifyL1CrowdKasTipInput): Promise<VerifyL1CrowdKasTipResult> {
  let tipToNorm: string;
  let payerNorm: string;
  try {
    tipToNorm = normalizeKaspaAddress(input.tipToKaspaAddress.trim());
    payerNorm = normalizeKaspaAddress(input.payerKaspaAddress.trim());
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid Kaspa address' };
  }

  const minSompi = kasToSompi(Math.max(0.001, input.minAmountKas));

  const tx = await getRestTransactionById(input.txHash.replace(/^0x/i, ''), { maxAttempts: 8, delayMs: 1400 });
  if (!tx) return { ok: false, error: 'Transaction not found yet. Wait for the indexer and try again.' };

  const paid = sumOutputsToAddress(tx, tipToNorm);
  if (paid < minSompi) {
    return { ok: false, error: `Tip output to the campaign address is too low (need at least ${input.minAmountKas} KAS).` };
  }

  const binding = parseDonationsL1TipPayload(getTxPayload(tx) ?? null);
  if (
    !binding ||
    binding.campaignId !== input.campaignId ||
    binding.donorEvm.toLowerCase() !== input.donorL2.toLowerCase()
  ) {
    return { ok: false, error: 'Transaction note must match this campaign and your connected EVM wallet.' };
  }

  const payers = payerAddressesFromTx(tx);
  if (payers.size > 0 && !payers.has(payerNorm)) {
    return { ok: false, error: 'Transaction inputs do not show your Kaspa wallet as the sender.' };
  }

  return { ok: true, paidSompi: paid };
}
