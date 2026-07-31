/**
 * KPX covenant platform fee payments (separate from lock principal).
 */

import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import type { CovenantTemplate } from '@/lib/programmability/types';
import type { KpxCovenantDeployPrice, KpxCovenantFeeAction } from './kpxCovenantPricing';
import { getKpxCovenantTreasuryAddress } from './kpxCovenantPricing';
import type { CovenantWalletContext } from './context';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import { buildHubPlatformFeePlan } from '@/lib/payments/paymentPlan';

export function buildKpxCovenantFeeNote(input: {
  template: CovenantTemplate;
  payloadTemplate: string;
  action: KpxCovenantFeeAction;
}): string {
  return `kpx-covenant|tmpl=${input.payloadTemplate}|action=${input.action}|hub=Kasparex`;
}

export async function payKpxCovenantPlatformFee(args: {
  ctx: CovenantWalletContext;
  pricing: KpxCovenantDeployPrice;
}): Promise<string | undefined> {
  const { pricing, ctx } = args;
  if (pricing.waived || pricing.feeSompi === '0') return undefined;

  const treasury = getKpxCovenantTreasuryAddress();
  if (!treasury) return undefined;
  if (!(pricing.feeKas > 0)) return undefined;
  if (!ctx.userAddress?.trim()) {
    throw new Error('Connect your Kaspa wallet to pay the platform fee');
  }

  const note = buildKpxCovenantFeeNote({
    template: pricing.template,
    payloadTemplate: pricing.payloadTemplate,
    action: pricing.action,
  });

  const plan = buildHubPlatformFeePlan({
    totalKas: pricing.feeKas,
    treasuryAddress: treasury,
    note,
  });
  const sent = await payKasPaymentPlan(
    ctx.provider as KaspaWalletProvider,
    plan,
    ctx.userAddress,
  );

  if (!sent.txHash) {
    throw new Error('Platform fee payment failed');
  }

  return extractKaspaTransactionId(sent.txHash) ?? sent.txHash;
}

/** @deprecated Prefer payKpxCovenantPlatformFee */
export async function payKpxCovenantDeployFee(args: {
  ctx: CovenantWalletContext;
  pricing: KpxCovenantDeployPrice;
}): Promise<string | undefined> {
  return payKpxCovenantPlatformFee(args);
}
