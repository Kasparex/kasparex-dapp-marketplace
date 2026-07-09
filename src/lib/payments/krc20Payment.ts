/**
 * Generic KRC-20 L1 transfer helper (any ticker).
 */

import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { KRC20_TRANSFER_TYPE, KREX_DECIMALS } from '@/lib/game/diamond-veins-config';

const DEFAULT_PRIORITY_FEE_KAS = 0.1;

export function encodeKrc20SmallestUnits(amount: number, decimals: number): string {
  const amountSmallest = Math.floor(amount * Math.pow(10, decimals));
  if (!Number.isFinite(amountSmallest) || amountSmallest <= 0) {
    throw new Error('KRC-20 amount too small to transfer');
  }
  return amountSmallest.toString();
}

export async function transferKrc20(
  provider: KaspaWalletProvider,
  params: {
    tick: string;
    amount: number;
    to: string;
    decimals?: number;
    priorityFeeKas?: number;
  },
): Promise<string> {
  const decimals = params.decimals ?? KREX_DECIMALS;
  const to = params.to.replace(/^kaspa:/i, '');
  const inscribeJson = {
    p: 'KRC-20',
    op: 'transfer',
    tick: params.tick.toUpperCase(),
    amt: encodeKrc20SmallestUnits(params.amount, decimals),
    to,
  };
  return signKrc20Transfer(
    provider,
    JSON.stringify(inscribeJson),
    KRC20_TRANSFER_TYPE,
    to,
    params.priorityFeeKas ?? DEFAULT_PRIORITY_FEE_KAS,
  );
}
