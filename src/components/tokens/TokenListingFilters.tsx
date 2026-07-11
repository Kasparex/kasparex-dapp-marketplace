'use client';

import { HubCryptoMultiFilter } from '@/components/hub/HubMultiSelectFilters';

export function TokenCryptocurrencyFilter({
  selectedCurrencies,
  onCurrenciesChange,
  currencyOptions,
}: {
  selectedCurrencies: string[];
  onCurrenciesChange: (next: string[]) => void;
  currencyOptions: string[];
}) {
  if (currencyOptions.length === 0) return null;

  return (
    <HubCryptoMultiFilter
      values={selectedCurrencies}
      onChange={onCurrenciesChange}
      options={currencyOptions}
    />
  );
}
