/**
 * Shared Hub payment currency types (KAS, KREX, integrated KRC-20 tickers).
 */

import { kasToKrexAmount, type StorePaymentCurrency } from '@/lib/store/currencies';

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

export function formatHubPaymentAmount(
  currency: HubPaymentCurrencyOption,
  kasAmount: number,
  directAmount?: number,
): string {
  if (currency.kind === 'krex') {
    return `${kasToKrexAmount(kasAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })} KREX`;
  }
  if (currency.kind === 'krc20' && directAmount != null) {
    return `${directAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${currency.tick ?? currency.id}`;
  }
  const formatted =
    Number.isInteger(kasAmount) ? `${kasAmount}` : kasAmount.toFixed(2).replace(/\.?0+$/, '');
  return `${formatted} KAS`;
}

export type HubPaymentQuoteLine = {
  label: string;
  value: string;
};
