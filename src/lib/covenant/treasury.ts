import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { COVENANT_LAB_CONFIG } from './config';

export async function payCovenantTreasury(args: {
  provider: KaspaWalletProvider;
  userAddress: string;
  amountSompi: string;
  note: string;
  dappId: string;
  actionType: string;
  amountKas: number;
}): Promise<string | undefined> {
  const treasury = COVENANT_LAB_CONFIG.treasuryAddress;
  if (!treasury) return undefined;

  const sent = await sendKaspaTransaction(args.provider, {
    to: treasury,
    amount: args.amountSompi,
    note: args.note,
  });
  if (sent.status === 'failed' || !sent.txHash) {
    throw new Error(sent.error || 'KAS payment failed');
  }
  const txHash = extractKaspaTransactionId(sent.txHash) ?? sent.txHash;

  void fetch('/api/rewards/l1/record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      txHash,
      userAddress: args.userAddress,
      dappId: args.dappId,
      actionType: args.actionType,
      actionValue: args.amountKas,
      network: 'L1',
    }),
  }).catch(() => {});

  return txHash;
}
