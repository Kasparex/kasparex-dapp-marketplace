'use client';

import { HubCryptocurrencyMultiFilter } from '@/components/hub/HubMultiSelectFilters';

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
    <HubCryptocurrencyMultiFilter
      values={selectedCurrencies}
      onChange={onCurrenciesChange}
      options={currencyOptions}
      placeholder="Cryptocurrency"
      filterPlaceholder="Filter currencies…"
    />
  );
}
