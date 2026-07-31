/**
 * After a KRC-20 / KREX (non-covenant) settlement, Hub still needs a native KAS
 * multi-out for treasury + rewards (token transfers cannot split outputs).
 * The KAS fee uses the same total and split structure as a pure-KAS Hub payment.
 */

import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import {
  buildHubPlatformFeePlan,
  HUB_PAYMENT_MIN_LEG_KAS,
  getHubTreasuryAddress,
} from '@/lib/payments/paymentPlan';

/** Floor so treasury + rewards can both meet the Hub min-leg when the quote is tiny. */
export const HUB_TOKEN_RAIL_FEE_MIN_KAS = HUB_PAYMENT_MIN_LEG_KAS * 2;

/** @deprecated Use the listing/action total via feeKas; kept for copy fallbacks. */
export const HUB_TOKEN_RAIL_FEE_KAS = HUB_TOKEN_RAIL_FEE_MIN_KAS;

/**
 * Resolve the Hub KAS fee total for a token rail: same structure as KAS multi-out
 * (full quote total), never a flat 1+1 placeholder.
 */
export function resolveHubTokenRailFeeKas(amountKas?: number | null): number {
  const n = typeof amountKas === 'number' && Number.isFinite(amountKas) ? amountKas : 0;
  return Math.max(HUB_TOKEN_RAIL_FEE_MIN_KAS, n);
}

export async function payHubTokenRailKasFee(args: {
  provider: KaspaWalletProvider;
  senderAddress: string;
  treasuryAddress?: string;
  /** KAS-equivalent total (same as pure-KAS Hub fee). Required for correct split. */
  feeKas: number;
  note?: string;
  payloadHex?: string;
}): Promise<string> {
  const feeKas = resolveHubTokenRailFeeKas(args.feeKas);
  const treasury = (args.treasuryAddress ?? getHubTreasuryAddress()).trim();
  if (!treasury) {
    throw new Error('Treasury address is not configured for the Hub KAS fee step');
  }
  const plan = buildHubPlatformFeePlan({
    totalKas: feeKas,
    treasuryAddress: treasury,
    note: args.note ?? 'hub-token-rail-fee',
    payloadHex: args.payloadHex,
  });
  const paid = await payKasPaymentPlan(args.provider, plan, args.senderAddress);
  if (!paid.txHash) {
    throw new Error('Hub KAS fee payment failed');
  }
  return extractKaspaTransactionId(paid.txHash) ?? paid.txHash;
}
