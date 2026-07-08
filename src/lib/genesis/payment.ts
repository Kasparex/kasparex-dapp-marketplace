import { kasToSompi } from '@/lib/ads/config';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import {
  fnv1aHex,
  VBLOG_CHUNK_SIZE_BYTES,
} from '@/lib/vblog/pricing';
import {
  splitPayloadToHexChunks,
  computeVBlogRootHash,
} from '@/lib/vblog/payloadHex';
import { buildCanonicalGenesisPayload } from './payload';
import {
  buildCapsuleCommitPayloadHex,
  buildCapsuleCommitPlainNote,
} from './payloadHex';
import { getKaspaCapsuleTreasuryL1Address } from './config';

export type KaspaCapsulePaymentResult = {
  txHash: string;
  messageId: string;
  contentHash: string;
  chunkCount: number;
  payloadBytes: number;
};

export function createCapsuleMessageId(): string {
  return `kcap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function sendKaspaCapsulePayment(args: {
  provider: KaspaWalletProvider;
  author: string;
  contentHtml: string;
  totalKas: number;
  messageId?: string;
}): Promise<KaspaCapsulePaymentResult> {
  const messageId = args.messageId ?? createCapsuleMessageId();
  const payload = buildCanonicalGenesisPayload({
    contentHtml: args.contentHtml,
    author: args.author,
  });
  const payloadBytes = new TextEncoder().encode(payload).length;
  const contentHash = fnv1aHex(payload);
  const chunkHexList = splitPayloadToHexChunks(payload, VBLOG_CHUNK_SIZE_BYTES);
  const chunkCount = chunkHexList.length;
  const rootHash = computeVBlogRootHash(chunkHexList);
  const treasury = getKaspaCapsuleTreasuryL1Address();
  const paymentKas = Math.max(0.01, Math.ceil(args.totalKas * 100) / 100);

  const commitNote = buildCapsuleCommitPlainNote({
    messageId,
    chunkTotal: chunkCount,
    rootHash,
    contentHash,
  });
  const commitPayload = buildCapsuleCommitPayloadHex({
    messageId,
    chunkTotal: chunkCount,
    rootHash,
    contentHash,
  });

  const commitTx = await sendKaspaTransaction(args.provider, {
    to: treasury,
    amount: String(kasToSompi(paymentKas)),
    note: commitNote,
    payload: commitPayload,
  });

  if (commitTx.status === 'failed' || !commitTx.txHash) {
    throw new Error(commitTx.error ?? 'Payment transaction failed');
  }

  const txHash = extractKaspaTransactionId(commitTx.txHash) ?? commitTx.txHash;

  return {
    txHash,
    messageId,
    contentHash,
    chunkCount,
    payloadBytes,
  };
}
