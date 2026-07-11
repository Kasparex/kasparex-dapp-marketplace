import { kasToSompi } from '@/lib/ads/config';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { getVBlogTreasuryL1Address } from '@/lib/vblog/config';
import { getDonationsModulesTreasuryL1Address } from '@/lib/donations/modulesConfig';

export function getCrowdKasTreasuryL1Address(): string {
  return getDonationsModulesTreasuryL1Address() || getVBlogTreasuryL1Address();
}

export async function payCrowdKasL1StudioFee(args: {
  provider: KaspaWalletProvider;
  totalKas: number;
  action?: 'create' | 'edit';
  note?: string;
}): Promise<string> {
  const treasury = getCrowdKasTreasuryL1Address();
  if (!treasury) {
    throw new Error('CrowdKAS treasury address is not configured.');
  }
  const paymentKas = Math.max(0.01, Math.ceil(args.totalKas * 100) / 100);
  const sent = await sendKaspaTransaction(args.provider, {
    to: treasury,
    amount: String(kasToSompi(paymentKas)),
    note: args.note ?? `crowdkas|action=${args.action ?? 'create'}|hub=Kasparex`,
  });
  if (sent.status === 'failed' || !sent.txHash) {
    throw new Error(sent.error ?? 'Payment failed');
  }
  return extractKaspaTransactionId(sent.txHash) ?? sent.txHash;
}
