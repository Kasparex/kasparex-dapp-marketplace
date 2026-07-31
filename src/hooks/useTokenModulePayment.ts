'use client';

import { useCallback } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import { getTokensTreasuryL1Address } from '@/lib/tokens/config';
import { useHubPayment } from '@/hooks/useHubPayment';
import { buildKasKrexCurrencyOptions } from '@/lib/payments/hubPaymentTypes';
import { buildHubPlatformFeePlan } from '@/lib/payments/paymentPlan';

export function useTokenModulePayment() {
  const { pay, isProcessing, error, setError } = useHubPayment();
  const { balance: krexL1Balance } = useKREXBalance();
  const { snapshot: pricingSnapshot } = usePricingSnapshot(['KREX']);

  const payModuleFee = useCallback(
    async (currency: StorePaymentCurrency, feeKas: number, note?: string): Promise<string> => {
      const option =
        buildKasKrexCurrencyOptions().find((c) => c.id === currency) ?? buildKasKrexCurrencyOptions()[0];
      if (currency === 'KREX') {
        const amountKrex = resolveTokenAmountFromKas(feeKas, 'KREX', pricingSnapshot);
        if (krexL1Balance + 1e-12 < amountKrex) {
          throw new Error('Insufficient KREX balance');
        }
      }
      const treasury = getTokensTreasuryL1Address();
      const plan =
        currency === 'KAS'
          ? buildHubPlatformFeePlan({
              totalKas: feeKas,
              treasuryAddress: treasury,
              note: note ?? 'Kasparex Tokens module unlock',
            })
          : undefined;
      return pay(option, {
        amountKas: feeKas,
        to: treasury,
        plan,
        note: note ?? 'Kasparex Tokens module unlock',
        pricingSnapshot,
      });
    },
    [pay, krexL1Balance, pricingSnapshot],
  );

  return { payModuleFee, isProcessing, error, setError };
}
