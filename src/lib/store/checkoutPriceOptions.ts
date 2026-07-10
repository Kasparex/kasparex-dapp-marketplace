import { buildHubCheckoutCurrencyOptions } from '@/lib/payments/hubPaymentTypes';
import {
  getProductPaymentCurrency,
  getProductPriceOptions,
  isBuiltinStoreCurrency,
  krexToKasAmount,
} from '@/lib/store/currencies';
import type { Product } from '@/lib/store/types';
import type { IntegratedToken } from '@/lib/tokens/integrationCore';
import { resolveTokenAmountFromKas, toKasEq } from '@/lib/pricing/registry';
import type { PricingSnapshot } from '@/lib/pricing/types';

export type StoreCheckoutPriceOption = {
  currency: string;
  unitPrice: number;
  label?: string;
  originalUnitPrice?: number;
  disabled?: boolean;
};

export function resolveStoreUnitPrice(
  product: Product,
  currency: string,
  snapshot: PricingSnapshot | null | undefined,
): number {
  const listed = getProductPaymentCurrency(product);
  if (listed === 'KAS' && currency !== 'KAS') {
    return resolveTokenAmountFromKas(product.priceKAS, currency, snapshot);
  }
  if (listed === 'KREX' && currency === 'KAS') {
    return toKasEq(product.priceKAS, 'KREX', snapshot) ?? krexToKasAmount(product.priceKAS);
  }
  if (!isBuiltinStoreCurrency(listed) && isBuiltinStoreCurrency(currency)) {
    const nativeKas = toKasEq(product.priceKAS, listed, snapshot) ?? product.priceKAS;
    if (currency === 'KREX') {
      return resolveTokenAmountFromKas(nativeKas, 'KREX', snapshot);
    }
    return nativeKas;
  }
  return getProductPriceOptions(product).find((o) => o.currency === currency)?.unitPrice ?? product.priceKAS;
}

export function buildStoreCheckoutPriceOptions(
  product: Product,
  integratedTokens: IntegratedToken[] | null | undefined,
  snapshot: PricingSnapshot | null | undefined,
): StoreCheckoutPriceOption[] {
  const listedCurrency = getProductPaymentCurrency(product);
  const hubOptions = buildHubCheckoutCurrencyOptions({
    listedCurrency,
    integratedTokens: integratedTokens ?? [],
  });

  return hubOptions.map((option) => ({
    currency: option.id,
    unitPrice: resolveStoreUnitPrice(product, option.id, snapshot),
    label: option.kind === 'krc20' ? `$${option.tick ?? option.id}` : option.label,
  }));
}
