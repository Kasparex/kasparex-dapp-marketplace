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
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import { buildHubPlatformFeePlan } from '@/lib/payments/paymentPlan';
import { transferKrc20 } from '@/lib/payments/krc20Payment';
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import type { PricingSnapshot } from '@/lib/pricing/types';
import type { HubPaymentCurrencyOption } from '@/lib/payments/hubPaymentTypes';
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
  /** Selected Pay with currency. Defaults to KAS multi-out with L1 payload. */
  currency?: HubPaymentCurrencyOption;
  pricingSnapshot?: PricingSnapshot | null;
  krexBalance?: number;
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

  const currency = args.currency;
  const kind = currency?.kind ?? 'kas';

  if (kind === 'krex' || kind === 'krc20') {
    const tick = kind === 'krex' ? 'KREX' : (currency?.tick ?? currency?.id ?? '').toUpperCase();
    if (!tick) throw new Error('Token ticker is required');
    const amount = resolveTokenAmountFromKas(paymentKas, tick, args.pricingSnapshot);
    if (kind === 'krex' && args.krexBalance != null && args.krexBalance + 1e-12 < amount) {
      throw new Error('Insufficient KREX balance');
    }
    const txHash = await transferKrc20(args.provider, {
      tick,
      amount,
      to: treasury,
      decimals: currency?.decimals ?? 8,
    });
    return {
      txHash,
      messageId,
      contentHash,
      chunkCount,
      payloadBytes,
    };
  }

  if (kind === 'kcc20') {
    throw new Error(
      'KCC-20 Hub fee settlement is enabling next. Pay with KAS, KREX, or a KRC-20 for now.',
    );
  }

  const plan = buildHubPlatformFeePlan({
    totalKas: paymentKas,
    treasuryAddress: treasury,
    note: commitNote,
    payloadHex: commitPayload,
  });
  const paid = await payKasPaymentPlan(args.provider, plan, args.author);
  if (!paid.txHash) {
    throw new Error('Payment transaction failed');
  }

  const txHash = extractKaspaTransactionId(paid.txHash) ?? paid.txHash;

  return {
    txHash,
    messageId,
    contentHash,
    chunkCount,
    payloadBytes,
  };
}
