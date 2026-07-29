import { kasToSompi } from '@/lib/ads/config';
import { getRestTransactionById, type KaspaRestTransaction, type KaspaRestTxOutput } from '@/lib/kaspa/api';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { getVBlogTreasuryL1Address } from '@/lib/vblog/config';
import { buildVBlogCommitPlainNote, computeVBlogRootHash, VBLOG_PAYLOAD_PREFIX } from '@/lib/vblog/payloadHex';

type VerifyInput = {
  articleId: string;
  op: 'create' | 'edit';
  payerAddress: string;
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

/** @deprecated Use txPaysAddressSompi */
function txPaysTreasurySompi(tx: KaspaRestTransaction, targetNorm: string): number {
  return txPaysAddressSompi(tx, targetNorm);
}

function payerAddressVariants(payerNorm: string): string[] {
  const trimmed = payerNorm.trim();
  const lower = trimmed.toLowerCase();
  const withoutPrefix = lower.replace(/^kaspa:/, '');
  return [...new Set([trimmed, lower, `kaspa:${withoutPrefix}`, withoutPrefix].filter(Boolean))];
}

function txHasPayerInput(tx: KaspaRestTransaction, payer: string): boolean {
  const inputs = tx.inputs ?? [];
  if (inputs.length === 0) return false;
  let payerNorm: string;
  try {
    payerNorm = normalizeKaspaAddress(payer);
  } catch {
    return false;
  }
  const variants = new Set(payerAddressVariants(payerNorm).map((v) => v.toLowerCase()));
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
      return variants.has(lower) || variants.has(lower.replace(/^kaspa:/, ''));
    }
  });
}

/** Article commit/chunk txs: indexer may omit input addresses briefly. */
function txHasPayerInputRelaxed(tx: KaspaRestTransaction, payer: string): boolean {
  const inputs = tx.inputs ?? [];
  if (inputs.length === 0) return true;
  return txHasPayerInput(tx, payer);
}

function txModuleReaderNoteMatches(
  tx: KaspaRestTransaction,
  args: { articleId: string; moduleId: string; payerNorm: string },
): boolean {
  const text = txPayload(tx);
  if (!text.includes(`${VBLOG_PAYLOAD_PREFIX}reader:`)) return false;
  if (!text.includes(`:${args.articleId}:${args.moduleId}:`)) return false;
  return payerAddressVariants(args.payerNorm).some((p) => text.includes(`:${args.moduleId}:${p}:`));
}

function txAffirmsModulePayer(
  tx: KaspaRestTransaction,
  payerNorm: string,
  articleId: string,
  moduleId: string,
): boolean {
  if (txHasPayerInput(tx, payerNorm)) return true;
  return txModuleReaderNoteMatches(tx, { articleId, moduleId, payerNorm });
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

  if (input.chunkHexList.length === 0) {
    return { ok: false, error: 'Invalid chunk metadata' };
  }
  const recomputedRoot = computeVBlogRootHash(input.chunkHexList);
  if (recomputedRoot !== input.rootHash) {
    return { ok: false, error: 'Invalid chunk root hash' };
  }

  const minSompi = kasToSompi(input.requiredTotalKas);
  let paidSompi = 0;

  const commitTx = await getRestTransactionById(input.commitTxHash, { maxAttempts: 8, delayMs: 1400 });
  if (!commitTx) return { ok: false, error: 'Commit transaction not found yet' };
  const expectedCommit = buildVBlogCommitPlainNote({
    articleId: input.articleId,
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
  paidSompi += txPaysTreasurySompi(commitTx, treasuryNorm);

  if (paidSompi < minSompi) {
    return { ok: false, error: `Underpaid transaction bundle: requires at least ${input.requiredTotalKas} KAS` };
  }

  return { ok: true };
}

type VerifyModulePaymentInput = {
  payerAddress: string;
  articleId: string;
  moduleId: 'premium_unlock' | 'tip_to_reveal_unlock' | 'tip_box';
  expectedAuthorAddress: string;
  expectedAuthorKas: number;
  expectedPlatformKas: number;
  authorTxHashes: string[];
  authorRecipientAddresses?: string[];
  platformTxHash: string;
};

function sumPaidToRecipientSet(tx: KaspaRestTransaction, recipients: Set<string>): number {
  let paid = 0;
  for (const o of tx.outputs ?? []) {
    const addr = outputAddress(o);
    if (!addr) continue;
    try {
      const norm = normalizeKaspaAddress(addr);
      if (!recipients.has(norm)) continue;
    } catch {
      continue;
    }
    const amt = typeof o.amount === 'string' ? parseInt(o.amount, 10) : Number(o.amount ?? 0);
    if (!Number.isNaN(amt) && amt > 0) paid += amt;
  }
  return paid;
}

export async function verifyVBlogModulePaymentSplit(input: VerifyModulePaymentInput): Promise<VerifyResult> {
  let payerNorm: string;
  let treasuryNorm: string;
  const recipientNorms = new Set<string>();
  try {
    payerNorm = normalizeKaspaAddress(input.payerAddress);
    treasuryNorm = normalizeKaspaAddress(getVBlogTreasuryL1Address());
    const recipients = input.authorRecipientAddresses?.length
      ? input.authorRecipientAddresses
      : [input.expectedAuthorAddress];
    for (const addr of recipients) {
      recipientNorms.add(normalizeKaspaAddress(addr));
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid address' };
  }

  const authorHashes = input.authorTxHashes.filter(Boolean);
  if (authorHashes.length === 0) {
    return { ok: false, error: 'Missing payment transaction hashes' };
  }

  const expectsPlatform = Number(input.expectedPlatformKas) > 1e-9;
  if (expectsPlatform && !input.platformTxHash) {
    return { ok: false, error: 'Missing payment transaction hashes' };
  }

  let paidAuthorSompi = 0;
  for (const hash of authorHashes) {
    const authorTx = await getRestTransactionById(hash, { maxAttempts: 6, delayMs: 1200 });
    if (!authorTx) return { ok: false, error: 'Payment transaction not found yet' };
    if (!txAffirmsModulePayer(authorTx, payerNorm, input.articleId, input.moduleId)) {
      return { ok: false, error: 'Payer mismatch in payment split' };
    }
    paidAuthorSompi += sumPaidToRecipientSet(authorTx, recipientNorms);
  }

  const authorMin = kasToSompi(input.expectedAuthorKas);
  if (paidAuthorSompi < authorMin) return { ok: false, error: 'Author payout underpaid' };

  if (!expectsPlatform) {
    return { ok: true };
  }

  const platformTx = await getRestTransactionById(input.platformTxHash, { maxAttempts: 6, delayMs: 1200 });
  if (!platformTx) return { ok: false, error: 'Payment transaction not found yet' };
  if (!txAffirmsModulePayer(platformTx, payerNorm, input.articleId, input.moduleId)) {
    return { ok: false, error: 'Payer mismatch in payment split' };
  }

  const platformMin = kasToSompi(input.expectedPlatformKas);
  const paidPlatform = txPaysAddressSompi(platformTx, treasuryNorm);
  if (paidPlatform < platformMin) return { ok: false, error: 'Platform fee underpaid' };

  return { ok: true };
}
