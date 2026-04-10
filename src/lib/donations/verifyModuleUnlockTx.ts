import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { getRestTransactionById, type KaspaRestTransaction, type KaspaRestTxOutput } from '@/lib/kaspa/api';
import { kasToSompi } from '@/lib/ads/config';
import { getDonationsModulesTreasuryL1Address } from '@/lib/donations/modulesConfig';
import { DONATIONS_MODULE_PAYLOAD_PREFIX, type DonationPaidModuleId } from '@/lib/donations/modules';

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

export function parseDonationsModulePayloadBinding(payload: string | null | undefined): {
  moduleId: DonationPaidModuleId;
  campaignId: string;
  payer: string;
} | null {
  if (!payload || typeof payload !== 'string') return null;
  const trimmed = payload.trim();
  const text = /^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0 ? peelHexPayloadLayers(trimmed) : trimmed;
  if (!text.startsWith(DONATIONS_MODULE_PAYLOAD_PREFIX)) return null;
  const rest = text.slice(DONATIONS_MODULE_PAYLOAD_PREFIX.length);
  const parts = rest.split(':').map((x) => x.trim());
  if (parts.length < 3) return null;
  const moduleId = parts[0] as DonationPaidModuleId;
  const campaignId = parts[1];
  const payer = parts.slice(2).join(':'); // keep kaspa: prefix intact
  if (!moduleId || !campaignId || !payer.startsWith('kaspa:')) return null;
  if (moduleId !== 'featured') return null;
  return { moduleId, campaignId, payer };
}

export type VerifyDonationsModuleUnlockInput = {
  txHash: string;
  moduleId: DonationPaidModuleId;
  campaignId: string;
  payerAddress: string;
  basePriceKas: number;
};

export type VerifyDonationsModuleUnlockResult = { ok: true; paidSompi: number } | { ok: false; error: string };

export async function verifyDonationsModuleUnlock(input: VerifyDonationsModuleUnlockInput): Promise<VerifyDonationsModuleUnlockResult> {
  const treasury = getDonationsModulesTreasuryL1Address();
  if (!treasury) return { ok: false, error: 'Treasury address is not configured.' };

  let treasuryNorm: string;
  let payerNorm: string;
  try {
    treasuryNorm = normalizeKaspaAddress(treasury);
    payerNorm = normalizeKaspaAddress(input.payerAddress);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid address' };
  }

  const minSompi = kasToSompi(Math.max(0.01, input.basePriceKas));

  const tx = await getRestTransactionById(input.txHash.replace(/^0x/i, ''), { maxAttempts: 8, delayMs: 1400 });
  if (!tx) return { ok: false, error: 'Transaction not found yet. Wait for the indexer and try again.' };

  const paid = sumOutputsToTreasury(tx, treasuryNorm);
  if (paid < minSompi) {
    return { ok: false, error: `Treasury output too low (need at least ${input.basePriceKas} KAS).` };
  }

  const binding = parseDonationsModulePayloadBinding(getTxPayload(tx) ?? null);
  if (!binding || binding.moduleId !== input.moduleId || binding.campaignId !== input.campaignId || normAddr(binding.payer) !== payerNorm) {
    return { ok: false, error: 'Payload does not match this module unlock and connected wallet.' };
  }

  const payers = payerAddressesFromTx(tx);
  if (payers.size > 0 && !payers.has(payerNorm)) {
    return { ok: false, error: 'Transaction inputs do not show your wallet as the payer.' };
  }

  return { ok: true, paidSompi: paid };
}

