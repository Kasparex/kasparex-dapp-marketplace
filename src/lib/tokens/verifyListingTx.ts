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

export type VerifyTokenListingBundleInput = {
  listingId: string;
  op: 'create' | 'edit';
  payerAddress: string;
  commitTxHash: string;
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

export async function verifyTokenListingTxBundle(
  input: VerifyTokenListingBundleInput,
): Promise<VerifyTokenListingResult> {
  let payerNorm: string;
  let treasuryNorm: string;
  try {
    payerNorm = normalizeKaspaAddress(input.payerAddress);
    treasuryNorm = normalizeKaspaAddress(getTokensTreasuryL1Address());
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

  const minSompi = kasToSompi(input.requiredTotalKas);
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

  const paid = txPaysAddressSompi(commitTx, treasuryNorm);
  if (paid < minSompi) {
    return {
      ok: false,
      error: `Treasury output too low (need at least ${input.requiredTotalKas} KAS).`,
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

  return { ok: true };
}
