import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { getRestTransactionById, type KaspaRestTransaction, type KaspaRestTxOutput } from '@/lib/kaspa/api';
import { kasToSompi } from '@/lib/ads/config';
import { getChroniclesVaultTreasuryL1Address } from '@/lib/chronicles/vault/config';
import {
  CHRONICLES_LB_READ_CONFIRM_KAS,
  CHRONICLES_LB_SLOT_ACTIVATION_KAS,
  CHRONICLES_LB_SLOT_CHANGE_KAS,
} from './constants';
import { chroniclesLbMinimumAcceptedKas } from './pricing';
import { parseChroniclesLbPayload } from './parse';
import type { ChroniclesLbEvent } from './types';

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

function requiredKasForEvent(e: ChroniclesLbEvent): number {
  if (e.kind === 'slot:activate') return CHRONICLES_LB_SLOT_ACTIVATION_KAS;
  if (e.kind === 'slot:set' || e.kind === 'slot:clear') return CHRONICLES_LB_SLOT_CHANGE_KAS;
  return CHRONICLES_LB_READ_CONFIRM_KAS;
}

export type VerifyChroniclesLbTxInput = {
  txHash: string;
  payerAddress: string;
};

export type VerifyChroniclesLbTxResult =
  | { ok: true; event: ChroniclesLbEvent; tx: KaspaRestTransaction }
  | { ok: false; error: string };

export async function verifyChroniclesLbTx(input: VerifyChroniclesLbTxInput): Promise<VerifyChroniclesLbTxResult> {
  const treasury = getChroniclesVaultTreasuryL1Address();
  let treasuryNorm: string;
  let payerNorm: string;
  try {
    treasuryNorm = normalizeKaspaAddress(treasury);
    payerNorm = normalizeKaspaAddress(input.payerAddress);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid address' };
  }

  const tx = await getRestTransactionById(input.txHash.replace(/^0x/i, ''), {
    maxAttempts: 8,
    delayMs: 1400,
  });
  if (!tx) {
    return { ok: false, error: 'Transaction not found yet. Wait for the indexer and try again.' };
  }

  const parsed = parseChroniclesLbPayload(tx.payload ?? null);
  if (!parsed) {
    return { ok: false, error: 'Transaction payload is not a Chronicles leaderboard action.' };
  }

  if (normAddr(parsed.payerKaspa) !== payerNorm) {
    return { ok: false, error: 'Payload payer does not match connected wallet.' };
  }

  const minKas = chroniclesLbMinimumAcceptedKas(requiredKasForEvent(parsed));
  const paid = sumOutputsToTreasury(tx, treasuryNorm);
  if (paid < kasToSompi(minKas)) {
    return { ok: false, error: `Treasury output too low (need at least ${minKas} KAS after holder discount floor).` };
  }

  const payers = payerAddressesFromTx(tx);
  if (payers.size > 0 && !payers.has(payerNorm)) {
    return { ok: false, error: 'Transaction inputs do not show your wallet as the payer.' };
  }

  return { ok: true, event: parsed, tx };
}

