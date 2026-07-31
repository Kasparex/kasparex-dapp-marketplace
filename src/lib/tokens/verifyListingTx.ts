import { kasToSompi } from '@/lib/ads/config';
import { getRestTransactionById, type KaspaRestTransaction, type KaspaRestTxOutput } from '@/lib/kaspa/api';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { getTokensTreasuryL1Address } from '@/lib/tokens/config';
import {
  buildTokenListingCommitPlainNote,
  computeTokenListingRootHash,
  parseTokenListingCommitPayload,
  parseTokenListingLegacyCommitPayload,
} from '@/lib/tokens/payloadHex';
import { buildHubPlatformFeePlan } from '@/lib/payments/paymentPlan';
import { verifyPaymentPlanTxs } from '@/lib/payments/verifyPaymentLegs';

export type VerifyTokenListingBundleInput = {
  listingId: string;
  op: 'create' | 'edit';
  payerAddress: string;
  commitTxHash: string;
  /** Extra hashes when the fee split was paid as sequential txs. */
  paymentTxHashes?: string[];
  chunkHexList: string[];
  contentHash: string;
  rootHash: string;
  requiredTotalKas: number;
};

export type VerifyTokenListingLegacyInput = {
  listingId: string;
  op: 'create' | 'edit';
  payerAddress: string;
  commitTxHash: string;
  paymentTxHashes?: string[];
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
  const raw = tx.payload;
  return peelHexPayload(typeof raw === 'string' ? raw : undefined);
}

function txHasPayerInputRelaxed(tx: KaspaRestTransaction, payer: string): boolean {
  const inputs = tx.inputs ?? [];
  if (inputs.length === 0) return true;
  let payerNorm: string;
  try {
    payerNorm = normalizeKaspaAddress(payer);
  } catch {
    return false;
  }
  const variants = new Set([
    payerNorm,
    payerNorm.toLowerCase(),
    payerNorm.replace(/^kaspa:/, ''),
  ]);
  return inputs.some((input) => {
    const raw =
      input.previous_outpoint_address ??
      input.previousOutpointAddress ??
      (input as { signature_script?: { address?: string } }).signature_script?.address;
    if (!raw) return false;
    try {
      const norm = normalizeKaspaAddress(String(raw)).toLowerCase();
      return variants.has(norm) || variants.has(norm.replace(/^kaspa:/, ''));
    } catch {
      const lower = String(raw).trim().toLowerCase();
      return variants.has(lower);
    }
  });
}

function uniqueTxHashes(primary: string, extras?: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [primary, ...(extras ?? [])]) {
    const h = raw.trim().replace(/^0x/i, '').toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(h) || seen.has(h)) continue;
    seen.add(h);
    out.push(h);
  }
  return out;
}

export async function verifyTokenListingTxBundle(
  input: VerifyTokenListingBundleInput,
): Promise<VerifyTokenListingResult> {
  let payerNorm: string;
  try {
    payerNorm = normalizeKaspaAddress(input.payerAddress);
    normalizeKaspaAddress(getTokensTreasuryL1Address());
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid address' };
  }

  if (input.chunkHexList.length === 0) {
    return { ok: false, error: 'Invalid chunk metadata' };
  }
  const recomputedRoot = computeTokenListingRootHash(input.chunkHexList);
  if (recomputedRoot !== input.rootHash) {
    return { ok: false, error: 'Invalid chunk root hash' };
  }

  const paymentKas = Math.max(0.01, Math.ceil(input.requiredTotalKas * 100) / 100);
  const plan = buildHubPlatformFeePlan({
    totalKas: paymentKas,
    treasuryAddress: getTokensTreasuryL1Address(),
  });

  const commitTx = await getRestTransactionById(input.commitTxHash.replace(/^0x/i, ''), {
    maxAttempts: 8,
    delayMs: 1400,
  });
  if (!commitTx) {
    return { ok: false, error: 'Commit transaction not found yet. Wait for the indexer and try again.' };
  }

  const expectedCommit = buildTokenListingCommitPlainNote({
    listingId: input.listingId,
    op: input.op,
    chunkTotal: input.chunkHexList.length,
    rootHash: input.rootHash,
    contentHash: input.contentHash,
    version: 1,
  });
  if (!txPayload(commitTx).startsWith(expectedCommit)) {
    return { ok: false, error: 'Commit payload mismatch' };
  }
  if (!txHasPayerInputRelaxed(commitTx, payerNorm)) {
    return { ok: false, error: 'Commit transaction payer mismatch' };
  }

  const paymentHashes = uniqueTxHashes(input.commitTxHash, input.paymentTxHashes);
  const legsCheck = await verifyPaymentPlanTxs({
    plan,
    txHashes: paymentHashes,
  });
  if (!legsCheck.ok) {
    return {
      ok: false,
      error: legsCheck.error ?? 'Payment split verification failed (treasury / rewards).',
    };
  }

  return { ok: true };
}

/** Legacy listings published before chunk bundle support. */
export async function verifyTokenListingTx(
  input: VerifyTokenListingLegacyInput,
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
  const plan = buildHubPlatformFeePlan({
    totalKas: minKas,
    treasuryAddress: getTokensTreasuryL1Address(),
  });

  const tx = await getRestTransactionById(input.commitTxHash.replace(/^0x/i, ''), {
    maxAttempts: 8,
    delayMs: 1400,
  });
  if (!tx) {
    return { ok: false, error: 'Transaction not found yet. Wait for the indexer and try again.' };
  }

  const binding =
    parseTokenListingCommitPayload(txPayload(tx) || null) ??
    parseTokenListingLegacyCommitPayload(txPayload(tx) || null);
  if (
    !binding ||
    binding.listingId !== input.listingId ||
    binding.op !== input.op ||
    binding.contentHash !== input.contentHash
  ) {
    return { ok: false, error: 'Payload does not match this listing commit.' };
  }

  if (!txHasPayerInputRelaxed(tx, payerNorm)) {
    return { ok: false, error: 'Transaction inputs do not show your wallet as the payer.' };
  }

  const paymentHashes = uniqueTxHashes(input.commitTxHash, input.paymentTxHashes);
  if (paymentHashes.length > 1 || plan.legs.length > 1) {
    const legsCheck = await verifyPaymentPlanTxs({ plan, txHashes: paymentHashes });
    if (!legsCheck.ok) {
      return {
        ok: false,
        error: legsCheck.error ?? 'Payment split verification failed (treasury / rewards).',
      };
    }
  } else {
    const minSompi = kasToSompi(minKas);
    const paid = txPaysAddressSompi(tx, treasuryNorm);
    if (paid < minSompi) {
      return {
        ok: false,
        error: `Treasury output too low (need at least ${minKas} KAS).`,
      };
    }
  }

  return { ok: true };
}
