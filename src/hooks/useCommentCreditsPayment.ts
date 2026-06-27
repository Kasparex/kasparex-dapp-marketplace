'use client';

import { useCallback, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { kasToSompis } from '@/lib/kaspa/api';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { kasToKrexAmount, type StorePaymentCurrency } from '@/lib/store/currencies';
import { KRC20_TRANSFER_TYPE, KREX_DECIMALS } from '@/lib/game/diamond-veins-config';

const COMMENT_CREDITS_TREASURY =
  'kaspa:qqd36zqt94yr23cmjj73d34e2lc05ltd9duw582s303m30ux567ps9ljnhp6y';
const KREX_PRIORITY_FEE_KAS = 0.1;

async function transferKrex(
  provider: NonNullable<ReturnType<typeof useKaspaWallet>['state']['provider']>,
  amountKrex: number,
  to: string,
): Promise<string> {
  const amountSmallest = Math.floor(amountKrex * Math.pow(10, KREX_DECIMALS));
  if (!Number.isFinite(amountSmallest) || amountSmallest <= 0) {
    throw new Error('KREX amount too small to transfer');
  }
  const inscribeJson = {
    p: 'KRC-20',
    op: 'transfer',
    tick: 'KREX',
    amt: amountSmallest.toString(),
    to,
  };
  return signKrc20Transfer(provider, JSON.stringify(inscribeJson), KRC20_TRANSFER_TYPE, to, KREX_PRIORITY_FEE_KAS);
}

export function useCommentCreditsPayment() {
  const { state } = useKaspaWallet();
  const { balance: krexL1Balance } = useKREXBalance();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payCredits = useCallback(
    async (currency: StorePaymentCurrency, feeKas: number, credits: number): Promise<string> => {
      if (!state.isConnected || !state.address || !state.provider) {
        throw new Error('Connect your Kaspa wallet to purchase credits');
      }
      if (state.provider !== 'kasware' && state.provider !== 'kastle') {
        throw new Error('Comment credits purchase requires KasWare or Kastle on L1');
      }

      setIsProcessing(true);
      setError(null);

      try {
        const treasuryAddress = COMMENT_CREDITS_TREASURY.replace(/^kaspa:/, '');

        if (currency === 'KREX') {
          const amountKrex = kasToKrexAmount(feeKas);
          if (krexL1Balance + 1e-12 < amountKrex) {
            throw new Error('Insufficient KREX balance');
          }
          return await transferKrex(state.provider, amountKrex, treasuryAddress);
        }

        const result = await sendKaspaTransaction(state.provider, {
          to: treasuryAddress,
          amount: kasToSompis(feeKas).toString(),
          note: `Comment Credits Purchase: ${credits} credits`,
        });
        if (result.status === 'failed' || !result.txHash) {
          throw new Error(result.error || 'Transaction failed');
        }
        return result.txHash;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment failed';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [state.isConnected, state.address, state.provider, krexL1Balance],
  );

  return { payCredits, isProcessing, error, setError, treasuryAddress: COMMENT_CREDITS_TREASURY };
}
