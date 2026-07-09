'use client';

import { useCallback, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { kasToKrexAmount, type StorePaymentCurrency } from '@/lib/store/currencies';
import { getTokensTreasuryL1Address } from '@/lib/tokens/config';
import { useHubPayment } from '@/hooks/useHubPayment';
import { buildKasKrexCurrencyOptions } from '@/lib/payments/hubPaymentTypes';

export function useTokenModulePayment() {
  const { pay, isProcessing, error, setError } = useHubPayment();
  const { balance: krexL1Balance } = useKREXBalance();

  const payModuleFee = useCallback(
    async (currency: StorePaymentCurrency, feeKas: number, note?: string): Promise<string> => {
      const option =
        buildKasKrexCurrencyOptions().find((c) => c.id === currency) ?? buildKasKrexCurrencyOptions()[0];
      if (currency === 'KREX') {
        const amountKrex = kasToKrexAmount(feeKas);
        if (krexL1Balance + 1e-12 < amountKrex) {
          throw new Error('Insufficient KREX balance');
        }
      }
      const treasury = getTokensTreasuryL1Address().replace(/^kaspa:/, '');
      return pay(option, { amountKas: feeKas, to: treasury, note: note ?? 'Kasparex Tokens module unlock' });
    },
    [pay, krexL1Balance],
  );

  return { payModuleFee, isProcessing, error, setError };
}
