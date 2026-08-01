import { MINECORE_KREX_PER_KAS } from '@/lib/game/minecore/config';
import type { Product } from './types';

export type StorePaymentCurrency = 'KAS' | 'KREX' | (string & {});

export const STORE_PAYMENT_CURRENCIES: Array<'KAS' | 'KREX'> = ['KAS', 'KREX'];

export function isBuiltinStoreCurrency(value: string): value is 'KAS' | 'KREX' {
  return value === 'KAS' || value === 'KREX';
}

export function normalizeStorePaymentCurrency(value: unknown): StorePaymentCurrency {
  if (value === 'KREX') return 'KREX';
  if (value === 'KAS' || value == null || value === '') return 'KAS';
  return String(value).toUpperCase();
}

export function getProductPaymentCurrency(product: Pick<Product, 'paymentCurrency'>): StorePaymentCurrency {
  return normalizeStorePaymentCurrency(product.paymentCurrency);
}

export function kasToKrexAmount(kas: number): number {
  /** Minecore / no-snapshot fallback. Prefer `resolveTokenAmountFromKas` + pricing snapshot for Hub. */
  return kas * MINECORE_KREX_PER_KAS;
}

export function krexToKasAmount(krex: number): number {
  /** Minecore / no-snapshot fallback. Prefer `toKasEq` + pricing snapshot for Hub. */
  return krex / MINECORE_KREX_PER_KAS;
}

export function getProductPriceOptions(product: Pick<Product, 'priceKAS' | 'paymentCurrency'>) {
  const listedCurrency = getProductPaymentCurrency(product);
  const unitPrice = product.priceKAS;

  if (!isBuiltinStoreCurrency(listedCurrency)) {
    return [{ currency: listedCurrency, unitPrice }];
  }

  if (listedCurrency === 'KREX') {
    return [
      { currency: 'KREX' as const, unitPrice },
      { currency: 'KAS' as const, unitPrice: krexToKasAmount(unitPrice) },
    ];
  }

  return [
    { currency: 'KAS' as const, unitPrice },
    { currency: 'KREX' as const, unitPrice: kasToKrexAmount(unitPrice) },
  ];
}

export function formatStoreCurrencyLabel(currency: StorePaymentCurrency): string {
  return currency;
}

/** Display label for a KAS-denominated price in the selected payment currency. */
export function formatPaymentLabel(currency: StorePaymentCurrency, kasAmount: number): string {
  const formattedKas =
    Number.isInteger(kasAmount) ? `${kasAmount}` : kasAmount.toFixed(2).replace(/\.?0+$/, '');
  if (currency === 'KREX') {
    return `${kasToKrexAmount(kasAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })} KREX`;
  }
  return `${formattedKas} KAS`;
}
