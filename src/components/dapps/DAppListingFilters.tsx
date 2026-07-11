'use client';

import { HubCryptoMultiFilter, HubTagsMultiFilter } from '@/components/hub/HubMultiSelectFilters';

export function DAppListingFiltersBar({
  selectedTags,
  onTagsChange,
  tagOptions,
  selectedCurrencies,
  onCurrenciesChange,
  currencyOptions,
}: {
  selectedTags: string[];
  onTagsChange: (next: string[]) => void;
  tagOptions: string[];
  selectedCurrencies: string[];
  onCurrenciesChange: (next: string[]) => void;
  currencyOptions: string[];
}) {
  return (
    <>
      {tagOptions.length > 0 ? (
        <HubTagsMultiFilter
          values={selectedTags}
          onChange={onTagsChange}
          options={tagOptions}
          placeholder="Tags"
          filterPlaceholder="Filter tags…"
        />
      ) : null}
      <HubCryptoMultiFilter
        values={selectedCurrencies}
        onChange={onCurrenciesChange}
        options={currencyOptions}
      />
    </>
  );
}
