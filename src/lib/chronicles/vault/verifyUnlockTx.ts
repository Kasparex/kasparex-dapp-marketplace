import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { getRestTransactionById, type KaspaRestTransaction, type KaspaRestTxOutput } from '@/lib/kaspa/api';
import { kasToSompi } from '@/lib/ads/config';
import { getChroniclesVaultTreasuryL1Address } from '@/lib/chronicles/vault/config';
import { VAULT_PAYLOAD_PREFIX, VAULT_MAX_COMBINED_DISCOUNT_PERCENT } from '@/lib/chronicles/vault/constants';

function peelHexPayloadLayers(raw: string): string {
  let s = raw.replace(/^0x/i, '').trim();
  for (let i = 0; i < 4; i++) {
    if (!/^[0-9a-fA-F]+$/.test(s) || s.length < 4 || s.length % 2 !== 0) break;
    try {
      const next = Buffer.from(s, 'hex').toString('utf8').trim();
      if (!next) break;
      s = next;
    } catch {
      break;
    }
  }
  return s;
}

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

export function parseVaultPayloadBinding(payload: string | null | undefined): {
  offerId: string;
  payer: string;
} | null {
  if (!payload || typeof payload !== 'string') return null;
  const trimmed = payload.trim();
  const text =
    /^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0 ? peelHexPayloadLayers(trimmed) : trimmed;
  if (!text.startsWith(VAULT_PAYLOAD_PREFIX)) return null;
  const rest = text.slice(VAULT_PAYLOAD_PREFIX.length);
  /** Offer ids have no `:`; payer is `kaspa:…` (one prefix colon only). */
  const idx = rest.indexOf(':');
  if (idx <= 0) return null;
  const offerId = rest.slice(0, idx).trim();
  const payer = rest.slice(idx + 1).trim();
  if (!offerId || !payer.startsWith('kaspa:')) return null;
  return { offerId, payer };
}

export type VerifyChroniclesVaultUnlockInput = {
  txHash: string;
  offerId: string;
  payerAddress: string;
  basePriceKas: number;
};

export type VerifyChroniclesVaultUnlockResult = { ok: true } | { ok: false; error: string };

/**
 * Confirms a vault payment: treasury output, minimum KAS after max discount, payload matches offer + payer, payer signed inputs.
 */
export async function verifyChroniclesVaultUnlock(
  input: VerifyChroniclesVaultUnlockInput
): Promise<VerifyChroniclesVaultUnlockResult> {
  const treasury = getChroniclesVaultTreasuryL1Address();
  let treasuryNorm: string;
  let payerNorm: string;
  try {
    treasuryNorm = normalizeKaspaAddress(treasury);
    payerNorm = normalizeKaspaAddress(input.payerAddress);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid address' };
  }

  const minKas = Math.max(
    0.01,
    Math.round(input.basePriceKas * (1 - VAULT_MAX_COMBINED_DISCOUNT_PERCENT / 100) * 100) / 100
  );
  const minSompi = kasToSompi(minKas);

  const tx = await getRestTransactionById(input.txHash.replace(/^0x/i, ''), {
    maxAttempts: 8,
    delayMs: 1400,
  });
  if (!tx) {
    return { ok: false, error: 'Transaction not found yet. Wait for the indexer and try again.' };
  }

  const paid = sumOutputsToTreasury(tx, treasuryNorm);
  if (paid < minSompi) {
    return {
      ok: false,
      error: `Treasury output too low (need at least ${minKas} KAS for this SKU with max holder discount).`,
    };
  }

  const binding = parseVaultPayloadBinding(getTxPayload(tx) ?? null);
  if (!binding || binding.offerId !== input.offerId || normAddr(binding.payer) !== payerNorm) {
    return { ok: false, error: 'Payload does not match this unlock and connected wallet.' };
  }

  const payers = payerAddressesFromTx(tx);
  if (payers.size > 0 && !payers.has(payerNorm)) {
    return { ok: false, error: 'Transaction inputs do not show your wallet as the payer.' };
  }

  return { ok: true };
}
