/**
 * After a KRC-20 / KREX (non-covenant) settlement, Hub still needs a native KAS
 * multi-out for treasury + rewards (token transfers cannot split outputs).
 */

import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import {
  buildHubPlatformFeePlan,
  HUB_PAYMENT_MIN_LEG_KAS,
  getHubTreasuryAddress,
} from '@/lib/payments/paymentPlan';

/** Minimum KAS so treasury + rewards can both meet the Hub min-leg floor. */
export const HUB_TOKEN_RAIL_FEE_KAS = HUB_PAYMENT_MIN_LEG_KAS * 2;

export async function payHubTokenRailKasFee(args: {
  provider: KaspaWalletProvider;
  senderAddress: string;
  treasuryAddress?: string;
  feeKas?: number;
  note?: string;
  payloadHex?: string;
}): Promise<string> {
  const feeKas = Math.max(HUB_TOKEN_RAIL_FEE_KAS, args.feeKas ?? HUB_TOKEN_RAIL_FEE_KAS);
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
