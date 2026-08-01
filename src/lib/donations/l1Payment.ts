import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { getVBlogTreasuryL1Address } from '@/lib/vblog/config';
import { getDonationsModulesTreasuryL1Address } from '@/lib/donations/modulesConfig';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import { buildHubPlatformFeePlan } from '@/lib/payments/paymentPlan';

export function getCrowdKasTreasuryL1Address(): string {
  return getDonationsModulesTreasuryL1Address() || getVBlogTreasuryL1Address();
}

export async function payCrowdKasL1StudioFee(args: {
  provider: KaspaWalletProvider;
  totalKas: number;
  action?: 'create' | 'edit';
  note?: string;
  senderAddress: string;
}): Promise<string> {
  const treasury = getCrowdKasTreasuryL1Address();
  if (!treasury) {
    throw new Error('CrowdKAS treasury address is not configured.');
  }
  if (!args.senderAddress?.trim()) {
    throw new Error('Connect your Kaspa wallet to pay the CrowdKAS fee.');
  }
  const paymentKas = Math.max(0.01, Math.ceil(args.totalKas * 100) / 100);
  const plan = buildHubPlatformFeePlan({
    totalKas: paymentKas,
    treasuryAddress: treasury,
    note: args.note ?? `crowdkas|action=${args.action ?? 'create'}|hub=Kasparex`,
  });
  const sent = await payKasPaymentPlan(args.provider, plan, args.senderAddress);
  if (!sent.txHash) {
    throw new Error('Payment failed');
  }
  return extractKaspaTransactionId(sent.txHash) ?? sent.txHash;
}
