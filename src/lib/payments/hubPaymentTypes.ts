/**
 * Shared Hub payment currency types (KAS, KREX, integrated KRC-20 tickers).
 */

import type { PricingSnapshot } from '@/lib/pricing/types';
import { formatHubPaymentFromKas, formatTokenAmount } from '@/lib/pricing/registry';
import { isBuiltinStoreCurrency, type StorePaymentCurrency } from '@/lib/store/currencies';
import type { IntegratedToken } from '@/lib/tokens/integrationCore';

export type HubPaymentCurrencyKind = 'kas' | 'krex' | 'krc20';

export type HubPaymentCurrencyOption = {
  id: string;
  label: string;
  kind: HubPaymentCurrencyKind;
  tick?: string;
  decimals?: number;
};

export function isBuiltinHubCurrency(id: string): id is StorePaymentCurrency {
  return id === 'KAS' || id === 'KREX';
}

export function buildKasKrexCurrencyOptions(): HubPaymentCurrencyOption[] {
  return [
    { id: 'KAS', label: 'KAS', kind: 'kas' },
    { id: 'KREX', label: 'KREX', kind: 'krex' },
  ];
}

export function buildKrc20CurrencyOption(tick: string, decimals = 8): HubPaymentCurrencyOption {
  const upper = tick.toUpperCase();
  return {
    id: upper,
    label: `$${upper}`,
    kind: 'krc20',
    tick: upper,
    decimals,
  };
}

export function buildHubCheckoutCurrencyOptions(opts: {
  listedCurrency: string;
  integratedToken?: IntegratedToken | null;
  integratedTokens?: IntegratedToken[];
}): HubPaymentCurrencyOption[] {
  const listed = opts.listedCurrency.trim().toUpperCase();
  if (!isBuiltinStoreCurrency(listed)) {
    return [buildKrc20CurrencyOption(listed)];
  }

  const options = [...buildKasKrexCurrencyOptions()];
  const integratedList = [
    ...(opts.integratedTokens ?? []),
    ...(opts.integratedToken ? [opts.integratedToken] : []),
  ];

  for (const integrated of integratedList) {
    if (!integrated?.tick) continue;
    if (!options.some((option) => option.id === integrated.tick)) {
      options.push(buildKrc20CurrencyOption(integrated.tick, integrated.decimals));
    }
  }

  return options;
}

export function buildIntegratedPaymentCurrencyIds(
  integratedToken?: IntegratedToken | null,
  integratedTokens?: IntegratedToken[],
): string[] {
  const currencies = ['KAS', 'KREX'];
  const all = [...(integratedTokens ?? []), ...(integratedToken ? [integratedToken] : [])];
  for (const token of all) {
    if (token?.tick && !currencies.includes(token.tick)) {
      currencies.push(token.tick);
    }
  }
  return currencies;
}

export function formatHubPaymentAmount(
  currency: HubPaymentCurrencyOption,
  kasAmount: number,
  opts?: { directAmount?: number; snapshot?: PricingSnapshot | null },
): string {
  if (currency.kind === 'krex') {
    return formatHubPaymentFromKas(kasAmount, 'KREX', opts?.snapshot, { showKasSuffix: false });
  }
  if (currency.kind === 'krc20' && opts?.directAmount != null) {
    return formatTokenAmount(opts.directAmount, currency.tick ?? currency.id);
  }
  return formatHubPaymentFromKas(kasAmount, 'KAS', opts?.snapshot, { showKasSuffix: false });
}

export type HubPaymentQuoteLine = {
  label: string;
  value: string;
};
