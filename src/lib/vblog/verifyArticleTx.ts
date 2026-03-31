import { kasToSompi } from '@/lib/ads/config';
import { getRestTransactionById, type KaspaRestTransaction, type KaspaRestTxOutput } from '@/lib/kaspa/api';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { getVBlogTreasuryL1Address } from '@/lib/vblog/config';
import { buildVBlogCommitPlainNote, buildVBlogChunkPlainNote } from '@/lib/vblog/payloadHex';

type VerifyInput = {
  articleId: string;
  op: 'create' | 'edit';
  payerAddress: string;
  chunkTxHashes: string[];
  commitTxHash: string;
  chunkHexList: string[];
  contentHash: string;
  rootHash: string;
  requiredTotalKas: number;
};

type VerifyResult = { ok: true } | { ok: false; error: string };

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

function txPaysTreasurySompi(tx: KaspaRestTransaction, treasury: string): number {
  let paid = 0;
  for (const o of tx.outputs ?? []) {
    const addr = outputAddress(o);
    if (!addr) continue;
    try {
      if (normalizeKaspaAddress(addr) !== treasury) continue;
    } catch {
      continue;
    }
    const amt = typeof o.amount === 'string' ? parseInt(o.amount, 10) : Number(o.amount ?? 0);
    if (!Number.isNaN(amt) && amt > 0) paid += amt;
  }
  return paid;
}

function txHasPayerInput(tx: KaspaRestTransaction, payer: string): boolean {
  const inputs = tx.inputs ?? [];
  if (inputs.length === 0) return true;
  return inputs.some((input) => {
    const a = input.previous_outpoint_address ?? input.previousOutpointAddress;
    if (!a) return false;
    try {
      return normalizeKaspaAddress(a) === payer;
    } catch {
      return false;
    }
  });
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
  return peelHexPayload(raw);
}

export async function verifyVBlogArticleTxBundle(input: VerifyInput): Promise<VerifyResult> {
  let payerNorm: string;
  let treasuryNorm: string;
  try {
    payerNorm = normalizeKaspaAddress(input.payerAddress);
    treasuryNorm = normalizeKaspaAddress(getVBlogTreasuryL1Address());
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid address' };
  }

  if (input.chunkTxHashes.length === 0 || input.chunkTxHashes.length !== input.chunkHexList.length) {
    return { ok: false, error: 'Invalid chunk bundle' };
  }

  const minSompi = kasToSompi(input.requiredTotalKas);
  let paidSompi = 0;

  for (let i = 0; i < input.chunkTxHashes.length; i++) {
    const tx = await getRestTransactionById(input.chunkTxHashes[i], { maxAttempts: 8, delayMs: 1400 });
    if (!tx) return { ok: false, error: `Chunk transaction ${i + 1} not found yet` };
    const expectedPayload = buildVBlogChunkPlainNote({
      articleId: input.articleId,
      op: input.op,
      chunkIndex: i,
      chunkTotal: input.chunkHexList.length,
      contentHash: input.contentHash,
      chunkDataHex: input.chunkHexList[i],
    });
    if (!txPayload(tx).startsWith(expectedPayload)) {
      return { ok: false, error: `Chunk payload mismatch at index ${i + 1}` };
    }
    if (!txHasPayerInput(tx, payerNorm)) {
      return { ok: false, error: `Chunk transaction ${i + 1} payer mismatch` };
    }
    paidSompi += txPaysTreasurySompi(tx, treasuryNorm);
  }

  const commitTx = await getRestTransactionById(input.commitTxHash, { maxAttempts: 8, delayMs: 1400 });
  if (!commitTx) return { ok: false, error: 'Commit transaction not found yet' };
  const expectedCommit = buildVBlogCommitPlainNote({
    articleId: input.articleId,
    op: input.op,
    chunkTotal: input.chunkHexList.length,
    rootHash: input.rootHash,
    version: 1,
  });
  if (!txPayload(commitTx).startsWith(expectedCommit)) {
    return { ok: false, error: 'Commit payload mismatch' };
  }
  if (!txHasPayerInput(commitTx, payerNorm)) {
    return { ok: false, error: 'Commit transaction payer mismatch' };
  }
  paidSompi += txPaysTreasurySompi(commitTx, treasuryNorm);

  if (paidSompi < minSompi) {
    return { ok: false, error: `Underpaid transaction bundle: requires at least ${input.requiredTotalKas} KAS` };
  }

  return { ok: true };
}
