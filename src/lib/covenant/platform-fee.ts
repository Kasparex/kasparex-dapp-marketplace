/**
 * KPX covenant platform fee payments (separate from lock principal).
 */

import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import type { CovenantTemplate } from '@/lib/programmability/types';
import type { KpxCovenantDeployPrice } from './kpxCovenantPricing';
import { getKpxCovenantTreasuryAddress } from './kpxCovenantPricing';
import type { CovenantWalletContext } from './context';

export function buildKpxCovenantFeeNote(input: {
  template: CovenantTemplate;
  payloadTemplate: string;
  action: 'deploy';
}): string {
  return `kpx-covenant|tmpl=${input.payloadTemplate}|action=${input.action}|hub=Kasparex`;
}

export async function payKpxCovenantDeployFee(args: {
  ctx: CovenantWalletContext;
  pricing: KpxCovenantDeployPrice;
}): Promise<string | undefined> {
  const { pricing, ctx } = args;
  if (pricing.waived || pricing.feeSompi === '0') return undefined;

  const treasury = getKpxCovenantTreasuryAddress();
  if (!treasury) return undefined;

  const note = buildKpxCovenantFeeNote({
    template: pricing.template,
    payloadTemplate: pricing.payloadTemplate,
    action: 'deploy',
  });

  const sent = await sendKaspaTransaction(ctx.provider as KaspaWalletProvider, {
    to: treasury,
    amount: pricing.feeSompi,
    note,
  });

  if (sent.status === 'failed' || !sent.txHash) {
    throw new Error(sent.error || 'Platform fee payment failed');
  }

  return extractKaspaTransactionId(sent.txHash) ?? sent.txHash;
}
