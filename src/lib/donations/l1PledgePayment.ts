/**
 * L1 covenant pledge payments: platform fee (multi-out rail) + covenant lock principal.
 */

import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { computeL1FeeKAS, getPlatformL1Address } from '@/lib/donations/config';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import { buildHubPlatformFeePlan, paymentPlanTotal } from '@/lib/payments/paymentPlan';
import { VDONATE_SHORT_NAME } from '@/lib/donations/brand';

export type VDonatePledgeQuote = {
  pledgeKas: number;
  platformFeeKas: number;
  totalKas: number;
};

/** Quote donor pays: pledge principal + L1 platform fee (1%, min 1 KAS). */
export function quoteVDonateL1Pledge(pledgeKas: number): VDonatePledgeQuote {
  const amount = Math.max(0, Number(pledgeKas) || 0);
  const platformFeeKas = amount > 0 ? computeL1FeeKAS(amount) : 0;
  return {
    pledgeKas: amount,
    platformFeeKas,
    totalKas: Math.round((amount + platformFeeKas) * 1e8) / 1e8,
  };
}

/**
 * Pay the Hub platform fee for an L1 covenant pledge via the shared multi-out KAS rail.
 * Returns the fee tx hash (undefined when fee is zero).
 */
export async function payVDonateL1PledgePlatformFee(args: {
  provider: KaspaWalletProvider;
  senderAddress: string;
  pledgeKas: number;
  campaignId: string;
}): Promise<{ feeTxHash?: string; platformFeeKas: number }> {
  const quote = quoteVDonateL1Pledge(args.pledgeKas);
  if (!(quote.platformFeeKas > 0)) {
    return { platformFeeKas: 0 };
  }

  const treasury = getPlatformL1Address();
  if (!treasury) {
    throw new Error(`${VDONATE_SHORT_NAME} platform fee address is not configured.`);
  }
  if (!args.senderAddress?.trim()) {
    throw new Error(`Connect your Kaspa wallet to pay the ${VDONATE_SHORT_NAME} platform fee.`);
  }

  const plan = buildHubPlatformFeePlan({
    totalKas: quote.platformFeeKas,
    treasuryAddress: treasury,
    note: `vdonate|action=pledge|campaign=${args.campaignId}|hub=Kasparex`,
  });
  if (!(paymentPlanTotal(plan) > 0)) {
    return { platformFeeKas: 0 };
  }

  const sent = await payKasPaymentPlan(args.provider, plan, args.senderAddress);
  if (!sent.txHash) {
    throw new Error('Platform fee payment failed');
  }
  return {
    feeTxHash: extractKaspaTransactionId(sent.txHash) ?? sent.txHash,
    platformFeeKas: quote.platformFeeKas,
  };
}
