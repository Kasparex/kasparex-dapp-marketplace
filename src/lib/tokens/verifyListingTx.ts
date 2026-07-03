import { kasToSompi } from '@/lib/ads/config';
import { getRestTransactionById, type KaspaRestTransaction, type KaspaRestTxOutput } from '@/lib/kaspa/api';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { getTokensTreasuryL1Address } from '@/lib/tokens/config';
import { parseTokenListingCommitPayload } from '@/lib/tokens/payloadHex';

export type VerifyTokenListingInput = {
  listingId: string;
  op: 'create' | 'edit';
  payerAddress: string;
  commitTxHash: string;
  contentHash: string;
  requiredTotalKas: number;
};

export type VerifyTokenListingResult = { ok: true } | { ok: false; error: string };

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
        set.add(normalizeKaspaAddress(a));
      } catch {
        set.add(a);
      }
    }
  }
  return set;
}

export async function verifyTokenListingTx(
  input: VerifyTokenListingInput,
): Promise<VerifyTokenListingResult> {
  let treasuryNorm: string;
  let payerNorm: string;
  try {
    treasuryNorm = normalizeKaspaAddress(getTokensTreasuryL1Address());
    payerNorm = normalizeKaspaAddress(input.payerAddress);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid address' };
  }

  const minKas = Math.max(0.01, Math.ceil(input.requiredTotalKas * 100) / 100);
  const minSompi = kasToSompi(minKas);

  const tx = await getRestTransactionById(input.commitTxHash.replace(/^0x/i, ''), {
    maxAttempts: 8,
    delayMs: 1400,
  });
  if (!tx) {
    return { ok: false, error: 'Transaction not found yet. Wait for the indexer and try again.' };
  }

  const paid = txPaysAddressSompi(tx, treasuryNorm);
  if (paid < minSompi) {
    return {
      ok: false,
      error: `Treasury output too low (need at least ${minKas} KAS).`,
    };
  }

  const binding = parseTokenListingCommitPayload(getTxPayload(tx) ?? null);
  if (
    !binding ||
    binding.listingId !== input.listingId ||
    binding.op !== input.op ||
    binding.contentHash !== input.contentHash
  ) {
    return { ok: false, error: 'Payload does not match this listing commit.' };
  }

  const payers = payerAddressesFromTx(tx);
  if (payers.size > 0 && !payers.has(payerNorm)) {
    return { ok: false, error: 'Transaction inputs do not show your wallet as the payer.' };
  }

  return { ok: true };
}
