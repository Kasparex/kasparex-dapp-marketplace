/**
 * L1 covenant pledge payments: platform fee as extra outputs on the same deploy tx.
 */

import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { kasToSompi } from '@/lib/ads/config';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { computeL1FeeKAS, getPlatformL1Address, VDONATIONS_FEE_BPS } from '@/lib/donations/config';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import { buildHubPlatformFeePlan, paymentPlanTotal } from '@/lib/payments/paymentPlan';
import { VDONATE_SHORT_NAME } from '@/lib/donations/brand';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';

export type VDonatePledgeQuote = {
  pledgeKas: number;
  /** Fee before KREX discount (1%, min 1 KAS). */
  platformFeeBaseKas: number;
  platformFeeKas: number;
  discountKas: number;
  discountPercent: number;
  totalKas: number;
};

export type CovenantFeePaymentOutput = {
  address: string;
  amountSompi: string;
};

/** Quote donor pays: pledge principal + L1 platform fee (1%, min 1 KAS, KREX tier discount). */
export function quoteVDonateL1Pledge(
  pledgeKas: number,
  krexTier: KREXTier = 'Tier0',
): VDonatePledgeQuote {
  const amount = Math.max(0, Number(pledgeKas) || 0);
  const discountPercent = KREX_TIERS[krexTier]?.feeDiscountPercent ?? 0;
  const platformFeeBaseKas = amount > 0 ? computeL1FeeKAS(amount, 0) : 0;
  const platformFeeKas = amount > 0 ? computeL1FeeKAS(amount, discountPercent) : 0;
  const discountKas = Math.max(0, Math.round((platformFeeBaseKas - platformFeeKas) * 1e8) / 1e8);
  return {
    pledgeKas: amount,
    platformFeeBaseKas,
    platformFeeKas,
    discountKas,
    discountPercent,
    totalKas: Math.round((amount + platformFeeKas) * 1e8) / 1e8,
  };
}

export function vDonatePlatformFeeBpsLabel(): string {
  return `${VDONATIONS_FEE_BPS / 100}%`;
}

/** Build platform fee / rewards legs as deploy-tx payment outputs (same multi-out as lock). */
export function buildVDonateL1PledgeFeeOutputs(args: {
  pledgeKas: number;
  campaignId: string;
  krexTier?: KREXTier;
}): { outputs: CovenantFeePaymentOutput[]; platformFeeKas: number; note: string } {
  const quote = quoteVDonateL1Pledge(args.pledgeKas, args.krexTier ?? 'Tier0');
  if (!(quote.platformFeeKas > 0)) {
    return { outputs: [], platformFeeKas: 0, note: '' };
  }
  const treasury = getPlatformL1Address();
  if (!treasury) {
    throw new Error(`${VDONATE_SHORT_NAME} platform fee address is not configured.`);
  }
  const note = `vdonate|action=pledge|campaign=${args.campaignId}|hub=Kasparex`;
  const plan = buildHubPlatformFeePlan({
    totalKas: quote.platformFeeKas,
    treasuryAddress: treasury,
    note,
  });
  const outputs: CovenantFeePaymentOutput[] = plan.legs
    .filter((leg) => leg.amount > 0 && leg.address?.trim())
    .map((leg) => ({
      address: leg.address.trim(),
      amountSompi: String(Math.floor(kasToSompi(leg.amount))),
    }))
    .filter((o) => BigInt(o.amountSompi) > 0n);
  return { outputs, platformFeeKas: quote.platformFeeKas, note };
}

/**
 * @deprecated Prefer embedding fee via buildVDonateL1PledgeFeeOutputs on the covenant deploy.
 * Kept for callers that still need a standalone fee payment.
 */
export async function payVDonateL1PledgePlatformFee(args: {
  provider: KaspaWalletProvider;
  senderAddress: string;
  pledgeKas: number;
  campaignId: string;
  krexTier?: KREXTier;
}): Promise<{ feeTxHash?: string; platformFeeKas: number }> {
  const built = buildVDonateL1PledgeFeeOutputs({
    pledgeKas: args.pledgeKas,
    campaignId: args.campaignId,
    krexTier: args.krexTier,
  });
  if (!(built.platformFeeKas > 0) || built.outputs.length === 0) {
    return { platformFeeKas: 0 };
  }
  if (!args.senderAddress?.trim()) {
    throw new Error(`Connect your Kaspa wallet to pay the ${VDONATE_SHORT_NAME} platform fee.`);
  }
  const treasury = getPlatformL1Address();
  if (!treasury) {
    throw new Error(`${VDONATE_SHORT_NAME} platform fee address is not configured.`);
  }
  const plan = buildHubPlatformFeePlan({
    totalKas: built.platformFeeKas,
    treasuryAddress: treasury,
    note: built.note,
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
    platformFeeKas: built.platformFeeKas,
  };
}
