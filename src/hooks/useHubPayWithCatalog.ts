'use client';

import { useMemo } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { buildPublicHubCurrencyCatalog } from '@/lib/payments/publicPaymentTokens';
import type { HubCurrencyCatalogEntry } from '@/lib/payments/currencyCatalog';
import type { HubPaymentCurrencyOption } from '@/lib/payments/hubPaymentTypes';
import type { PricingSnapshot } from '@/lib/pricing/types';
import type { IntegratedToken } from '@/lib/tokens/integrationCore';

/**
 * Shared Pay-with catalog for listing rails, shop cards, and checkout.
 * Includes KAS/KREX plus deployer-verified public KRC-20 / KCC-20 Tokens.
 */
export function useHubPayWithCatalog(opts?: {
  amountKas?: number;
  pricingSnapshot?: PricingSnapshot | null;
  integratedTokens?: IntegratedToken[];
  kcc20Tokens?: Array<{
    id: string;
    label: string;
    covenantId: string;
    decimals?: number;
    ticker?: string;
  }>;
}): {
  catalogEntries: HubCurrencyCatalogEntry[];
  krexBalance: number;
  pricingSnapshot: PricingSnapshot | null | undefined;
} {
  const { balance: krexBalance } = useKREXBalance();
  const { snapshot } = usePricingSnapshot(['KREX']);
  const pricingSnapshot = opts?.pricingSnapshot ?? snapshot;

  const catalogEntries = useMemo(
    () =>
      buildPublicHubCurrencyCatalog({
        amountKas: opts?.amountKas,
        pricingSnapshot,
        krexBalance,
        extra: {
          integratedTokens: opts?.integratedTokens,
          kcc20Tokens: opts?.kcc20Tokens,
        },
      }),
    [opts?.amountKas, opts?.integratedTokens, opts?.kcc20Tokens, pricingSnapshot, krexBalance],
  );

  return { catalogEntries, krexBalance, pricingSnapshot };
}

/** Map a catalog selection onto KAS/KREX store currency when possible. */
export function hubCatalogSelectionToStoreCurrency(
  option: HubPaymentCurrencyOption,
): 'KAS' | 'KREX' | string {
  if (option.kind === 'kas') return 'KAS';
  if (option.kind === 'krex') return 'KREX';
  return option.id;
}
