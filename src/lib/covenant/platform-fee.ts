/**
 * KPX covenant platform fee payments.
 * Prefer embedding fee outputs on the covenant deploy (one multi-output tx).
 */

import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { kasToSompi } from '@/lib/ads/config';
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

export type KpxCovenantFeePaymentOutput = {
  address: string;
  amountSompi: string;
};

/** Platform fee / rewards legs for embedding on a covenant deploy tx. */
export function buildKpxCovenantFeeOutputs(args: {
  pricing: KpxCovenantDeployPrice;
}): { outputs: KpxCovenantFeePaymentOutput[]; note: string } {
  const { pricing } = args;
  if (pricing.waived || pricing.feeSompi === '0' || !(pricing.feeKas > 0)) {
    return { outputs: [], note: '' };
  }
  const treasury = getKpxCovenantTreasuryAddress();
  if (!treasury) return { outputs: [], note: '' };

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
  const outputs = plan.legs
    .filter((leg) => leg.amount > 0 && leg.address?.trim())
    .map((leg) => ({
      address: leg.address.trim(),
      amountSompi: String(Math.floor(kasToSompi(leg.amount))),
    }))
    .filter((o) => BigInt(o.amountSompi) > 0n);
  return { outputs, note };
}

/**
 * Standalone fee payment (legacy / claim when fee cannot ride on the spend).
 * Deploy flows should prefer buildKpxCovenantFeeOutputs on the lock tx.
 */
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
