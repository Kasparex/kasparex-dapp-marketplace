'use client';

import { useCallback, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { transferKrc20 } from '@/lib/payments/krc20Payment';
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import type { PricingSnapshot } from '@/lib/pricing/types';
import type { HubPaymentCurrencyOption } from '@/lib/payments/hubPaymentTypes';

export function useHubPayment() {
  const { state } = useKaspaWallet();
  const { balance: krexL1Balance } = useKREXBalance();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = useCallback(
    async (
      currency: HubPaymentCurrencyOption,
      params: {
        amountKas?: number;
        amountDirect?: number;
        to: string;
        note?: string;
        pricingSnapshot?: PricingSnapshot | null;
      },
    ): Promise<string> => {
      if (!state.isConnected || !state.address || !state.provider) {
        throw new Error('Connect your Kaspa wallet to pay');
      }

      const treasury = params.to.replace(/^kaspa:/i, '');
      if (!treasury) throw new Error('Recipient address is not configured');

      setIsProcessing(true);
      setError(null);

      try {
        if (currency.kind === 'krc20') {
          const amount = params.amountDirect;
          if (amount == null || amount <= 0) throw new Error('Invalid token amount');
          return await transferKrc20(state.provider, {
            tick: currency.tick ?? currency.id,
            amount,
            to: treasury,
            decimals: currency.decimals ?? 8,
          });
        }

        if (currency.kind === 'krex') {
          const feeKas = params.amountKas;
          if (feeKas == null || feeKas <= 0) throw new Error('Invalid payment amount');
          const amountKrex = resolveTokenAmountFromKas(feeKas, 'KREX', params.pricingSnapshot);
          if (krexL1Balance + 1e-12 < amountKrex) {
            throw new Error('Insufficient KREX balance');
          }
          return await transferKrc20(state.provider, {
            tick: 'KREX',
            amount: amountKrex,
            to: treasury,
          });
        }

        const feeKas = params.amountKas;
        if (feeKas == null || feeKas <= 0) throw new Error('Invalid payment amount');
        const result = await sendKaspaTransaction(state.provider, {
          to: treasury,
          amount: kasToSompis(feeKas).toString(),
          note: params.note,
        });
        if (result.status === 'failed' || !result.txHash) {
          throw new Error(result.error || 'Payment failed');
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

  return { pay, isProcessing, error, setError };
}
