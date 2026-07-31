import { kasToSompi } from '@/lib/ads/config';
import { formatKaspaWalletError } from '@/lib/kaspa/formatWalletError';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import {
  isStorageMassErrorMessage,
  readHighMassMode,
  retryKasCandidates,
} from '@/lib/kaspa/tx-mass-mode';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { VBLOG_READER_MIN_OUTPUT_KAS } from '@/lib/vblog/readerPricing';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import {
  buildCreatorPlatformPlan,
  type PaymentLeg,
} from '@/lib/payments/paymentPlan';

/**
 * Send a reader unlock / tip KAS payment with on-chain payload binding.
 * Payload only (no duplicate note) to keep transient mass lower.
 * Retries with larger amounts when the wallet hits storage mass limits.
 * Verify endpoints accept overpayment (minimum checks only).
 */
export async function sendVBlogReaderKasTx(args: {
  provider: KaspaWalletProvider;
  to: string;
  amountKas: number;
  payloadHex: string;
}): Promise<{ txHash: string; paidKas: number }> {
  const baseKas = Math.max(VBLOG_READER_MIN_OUTPUT_KAS, Number(args.amountKas.toFixed(8)));
  const highMass = readHighMassMode();
  const candidates = retryKasCandidates(baseKas, highMass);
  let lastErr: string | null = null;

  for (const candidateKas of candidates) {
    const sompi = kasToSompi(candidateKas);
    if (sompi <= 0) continue;

    const txRes = await sendKaspaTransaction(args.provider, {
      to: args.to,
      amount: String(sompi),
      payload: args.payloadHex,
    });

    if (txRes.status !== 'failed' && txRes.txHash) {
      return {
        txHash: extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash,
        paidKas: candidateKas,
      };
    }

    lastErr = txRes.error ?? 'Payment transaction was rejected or failed';
    if (!isStorageMassErrorMessage(formatKaspaWalletError(lastErr))) break;
  }

  throw new Error(formatKaspaWalletError(lastErr ?? 'Payment transaction failed'));
}

/**
 * Atomic (preferred) KAS reader payment: author/creator legs + platform fee in one tx.
 * Falls back to sequential single-output sends when multi-out is unavailable.
 */
export async function sendVBlogReaderKasSplitPlan(args: {
  provider: KaspaWalletProvider;
  senderAddress: string;
  authorLegs: Array<{ address: string; amountKas: number; label?: string }>;
  platformKas?: number;
  platformAddress?: string;
  payloadHex: string;
  note?: string;
}): Promise<{ txHash: string; atomic: boolean; extraTxHashes?: string[] }> {
  const extraLegs: PaymentLeg[] = args.authorLegs.slice(1).map((leg, i) => ({
    role: 'author' as const,
    address: leg.address,
    amount: Math.max(VBLOG_READER_MIN_OUTPUT_KAS, leg.amountKas),
    label: leg.label ?? `Author share ${i + 2}`,
    required: true,
  }));

  const primary = args.authorLegs[0];
  if (!primary) throw new Error('Author payout address is required');

  const plan = buildCreatorPlatformPlan({
    creatorAddress: primary.address,
    creatorKas: primary.amountKas,
    creatorLabel: primary.label ?? 'Author',
    platformKas: args.platformKas,
    platformAddress: args.platformAddress,
    payloadHex: args.payloadHex,
    note: args.note,
    extraLegs,
  });

  try {
    const result = await payKasPaymentPlan(args.provider, plan, args.senderAddress);
    return result;
  } catch (err) {
    // Sequential fallback with mass retries per leg.
    const hashes: string[] = [];
    for (const leg of plan.legs) {
      const paid = await sendVBlogReaderKasTx({
        provider: args.provider,
        to: leg.address,
        amountKas: leg.amount,
        payloadHex: args.payloadHex,
      });
      hashes.push(paid.txHash);
    }
    if (hashes.length === 0) {
      throw err instanceof Error ? err : new Error('Split payment failed');
    }
    return {
      txHash: hashes[0]!,
      atomic: false,
      extraTxHashes: hashes.length > 1 ? hashes.slice(1) : undefined,
    };
  }
}

export async function parseJsonResponse<T extends Record<string, unknown>>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      `Empty response from server (${res.status}). Payment may have succeeded in your wallet; wait a moment and retry unlock, or check transaction history.`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Invalid response from server (${res.status}). Payment may have succeeded in your wallet; wait a moment and retry unlock, or check transaction history.`,
    );
  }
}
