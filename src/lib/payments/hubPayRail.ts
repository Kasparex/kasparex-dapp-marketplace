/**
 * Unified Hub payment rails (one choke point for KAS / token product / token listing).
 *
 * (a) Pure KAS: one multi-out plan.
 * (b) Product purchase in token: seller + platform token split; never a second KAS fee.
 * (c) Listing / platform fee in token: full token to treasury; optional min KAS commit only when payload is required.
 */

import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { transferKrc20 } from '@/lib/payments/krc20Payment';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import {
  buildCreatorPlatformPlan,
  buildHubPlatformFeePlan,
  type PaymentPlan,
} from '@/lib/payments/paymentPlan';
import { splitTokenPayment } from '@/lib/payments/splitTokenPayment';
import {
  hubTokenRailNeedsKasCommit,
  payHubTokenRailKasFee,
  resolveHubTokenRailFeeKas,
} from '@/lib/payments/tokenRailKasFee';
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import type { PricingSnapshot } from '@/lib/pricing/types';

export {
  hubTokenRailNeedsKasCommit,
  resolveHubTokenRailFeeKas,
  HUB_TOKEN_RAIL_FEE_MIN_KAS,
  HUB_TOKEN_RAIL_FEE_KAS,
} from '@/lib/payments/tokenRailKasFee';

export async function payHubKasPlan(args: {
  provider: KaspaWalletProvider;
  senderAddress: string;
  plan: PaymentPlan;
}): Promise<string> {
  const paid = await payKasPaymentPlan(args.provider, args.plan, args.senderAddress);
  if (!paid.txHash) throw new Error('KAS payment failed');
  return extractKaspaTransactionId(paid.txHash) ?? paid.txHash;
}

/** Store / vBlog-style purchase: token legs sum to total; no Hub KAS fee. */
export async function payHubTokenProductSplit(args: {
  provider: KaspaWalletProvider;
  tick: string;
  totalToken: number;
  sellerKas: number;
  totalKas: number;
  sellerAddress: string;
  platformAddress: string;
  decimals?: number;
}): Promise<string> {
  const { sellerToken, platformToken } = splitTokenPayment(
    args.totalToken,
    args.sellerKas,
    args.totalKas,
    args.decimals,
  );
  const sellerTx = await transferKrc20(args.provider, {
    tick: args.tick,
    amount: sellerToken,
    to: args.sellerAddress,
    decimals: args.decimals,
  });
  if (platformToken > 1e-9) {
    await transferKrc20(args.provider, {
      tick: args.tick,
      amount: platformToken,
      to: args.platformAddress,
      decimals: args.decimals,
    });
  }
  return extractKaspaTransactionId(sellerTx) ?? sellerTx;
}

/** Listing / Hub fee in KRC-20 or KREX: settle once in token; optional min KAS commit for payload. */
export async function payHubTokenListingFee(args: {
  provider: KaspaWalletProvider;
  senderAddress: string;
  tick: string;
  feeKas: number;
  treasuryAddress: string;
  pricingSnapshot?: PricingSnapshot | null;
  decimals?: number;
  note?: string;
  payloadHex?: string;
  forceKasCommit?: boolean;
  amountToken?: number;
}): Promise<{ tokenTxHash: string; kasCommitTxHash: string | null }> {
  const amount =
    args.amountToken ??
    resolveTokenAmountFromKas(args.feeKas, args.tick, args.pricingSnapshot);
  if (!(amount > 0)) throw new Error('Invalid token listing fee amount');

  const tokenTx = await transferKrc20(args.provider, {
    tick: args.tick,
    amount,
    to: args.treasuryAddress,
    decimals: args.decimals,
  });
  const kasCommitTxHash = await payHubTokenRailKasFee({
    provider: args.provider,
    senderAddress: args.senderAddress,
    treasuryAddress: args.treasuryAddress,
    note: args.note,
    payloadHex: args.payloadHex,
    forceCommit: args.forceKasCommit,
  });
  return {
    tokenTxHash: extractKaspaTransactionId(tokenTx) ?? tokenTx,
    kasCommitTxHash,
  };
}

export function buildHubKasListingPlan(args: {
  feeKas: number;
  treasuryAddress: string;
  /** Override Hub rewards leg (e.g. disable / redirect on testnet). */
  rewardsAddress?: string;
  rewardsBps?: number;
  note?: string;
  payloadHex?: string;
}): PaymentPlan {
  return buildHubPlatformFeePlan({
    totalKas: args.feeKas,
    treasuryAddress: args.treasuryAddress,
    rewardsAddress: args.rewardsAddress,
    rewardsBps: args.rewardsBps,
    note: args.note,
    payloadHex: args.payloadHex,
  });
}

export function buildHubKasProductPlan(args: {
  sellerAddress: string;
  sellerKas: number;
  platformKas: number;
  platformAddress: string;
  note?: string;
}): PaymentPlan {
  return buildCreatorPlatformPlan({
    creatorAddress: args.sellerAddress,
    creatorKas: args.sellerKas,
    creatorLabel: 'Seller',
    platformKas: args.platformKas,
    platformAddress: args.platformAddress,
    note: args.note,
  });
}
