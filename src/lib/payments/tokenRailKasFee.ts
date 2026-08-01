/**
 * Hub token-rail KAS commit (NOT a second listing fee).
 *
 * Token / KREX already settles the economic amount to treasury.
 * A native KAS tx is only needed when we must attach an L1 payload
 * (capsule / token listing commit). That commit is a fixed min amount
 * to treasury only (no rewards split, never the full quote again).
 */

import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import {
  HUB_PAYMENT_MIN_LEG_KAS,
  getHubTreasuryAddress,
  type PaymentPlan,
} from '@/lib/payments/paymentPlan';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

/** Fixed KAS commit after token settlement (single treasury out). */
export const HUB_TOKEN_RAIL_FEE_MIN_KAS = HUB_PAYMENT_MIN_LEG_KAS * 2;

/** @deprecated Alias of the commit floor (not a listing fee). */
export const HUB_TOKEN_RAIL_FEE_KAS = HUB_TOKEN_RAIL_FEE_MIN_KAS;

/**
 * KAS amount for the optional token-rail commit step.
 * Ignores quote totals on purpose: never re-charge the listing fee in KAS.
 */
export function resolveHubTokenRailFeeKas(_quoteKas?: number | null): number {
  return HUB_TOKEN_RAIL_FEE_MIN_KAS;
}

export function hubTokenRailNeedsKasCommit(args: {
  payloadHex?: string | null;
  forceCommit?: boolean;
}): boolean {
  return Boolean(args.payloadHex?.trim()) || args.forceCommit === true;
}

function normAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) throw new Error('Payment leg address is empty');
  try {
    return normalizeKaspaAddress(trimmed);
  } catch {
    return trimmed.startsWith('kaspa:') || trimmed.startsWith('kaspatest:')
      ? trimmed
      : `kaspa:${trimmed}`;
  }
}

/** Single-leg commit plan so wallet payment outs = 1 (+ change), amount = exactly 2 KAS. */
export function buildHubTokenRailCommitPlan(args: {
  treasuryAddress?: string;
  note?: string;
  payloadHex?: string;
}): PaymentPlan {
  const treasury = (args.treasuryAddress ?? getHubTreasuryAddress()).trim();
  if (!treasury) throw new Error('Treasury address is not configured for the Hub KAS commit step');
  return {
    legs: [
      {
        role: 'treasury',
        address: normAddress(treasury),
        amount: HUB_TOKEN_RAIL_FEE_MIN_KAS,
        label: 'L1 payload commit',
        required: true,
      },
    ],
    note: args.note ?? 'hub-token-rail-commit',
    payloadHex: args.payloadHex,
  };
}

/**
 * Optional KAS multi-out after token settlement.
 * Returns null when skipped (token-only settlement, no double charge).
 */
export async function payHubTokenRailKasFee(args: {
  provider: KaspaWalletProvider;
  senderAddress: string;
  treasuryAddress?: string;
  /**
   * @deprecated Ignored for amount. Kept so call sites that passed the quote
   * keep compiling; economic fee is already paid in the token transfer.
   */
  feeKas?: number;
  note?: string;
  payloadHex?: string;
  /** Force a min KAS commit even without payloadHex (rare). */
  forceCommit?: boolean;
}): Promise<string | null> {
  if (!hubTokenRailNeedsKasCommit(args)) {
    return null;
  }

  const plan = buildHubTokenRailCommitPlan({
    treasuryAddress: args.treasuryAddress,
    note: args.note,
    payloadHex: args.payloadHex,
  });
  const paid = await payKasPaymentPlan(args.provider, plan, args.senderAddress);
  if (!paid.txHash) {
    throw new Error('Hub KAS commit payment failed');
  }
  return extractKaspaTransactionId(paid.txHash) ?? paid.txHash;
}
