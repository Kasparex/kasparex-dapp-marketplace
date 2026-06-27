'use client';

import { useCallback, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { kasToKrexAmount, type StorePaymentCurrency } from '@/lib/store/currencies';
import { DAPP_LISTING_FEE_KAS } from '@/lib/dapps/listingSubmissions';
import { KRC20_TRANSFER_TYPE, KREX_DECIMALS } from '@/lib/game/diamond-veins-config';

const TREASURY = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';
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

export function useDAppListingPayment() {
  const { state } = useKaspaWallet();
  const { balance: krexL1Balance } = useKREXBalance();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payFee = useCallback(
    async (currency: StorePaymentCurrency, feeKas: number): Promise<string> => {
      if (!state.isConnected || !state.address || !state.provider) {
        throw new Error('Connect your Kaspa wallet to pay the listing fee');
      }
      if (!TREASURY) {
        throw new Error('Listing treasury address is not configured');
      }

      setIsProcessing(true);
      setError(null);

      try {
        if (currency === 'KREX') {
          const amountKrex = kasToKrexAmount(feeKas);
          if (krexL1Balance + 1e-12 < amountKrex) {
            throw new Error('Insufficient KREX balance for listing fee');
          }
          return await transferKrex(state.provider, amountKrex, TREASURY);
        }

        const result = await sendKaspaTransaction(state.provider, {
          to: TREASURY,
          amount: kasToSompis(feeKas).toString(),
        });
        if (result.status === 'failed') {
          throw new Error(result.error || 'Listing fee payment failed');
        }
        return result.txHash;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Listing fee payment failed';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [state.isConnected, state.address, state.provider, krexL1Balance],
  );

  const payListingFee = useCallback(
    (currency: StorePaymentCurrency) => payFee(currency, DAPP_LISTING_FEE_KAS),
    [payFee],
  );

  const payActionFee = useCallback(
    (currency: StorePaymentCurrency, feeKas: number) => payFee(currency, feeKas),
    [payFee],
  );

  return { payListingFee, payActionFee, isProcessing, error, setError };
}
