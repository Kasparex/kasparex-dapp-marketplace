'use client';

import { useMemo } from 'react';
import { categories, type Category } from '@/lib/categories';
import {
  HubCategoryMultiFilter,
  HubCryptocurrencyMultiFilter,
  HubTagsMultiFilter,
} from '@/components/hub/HubMultiSelectFilters';
import type { KxMultiSelectOption } from '@/components/ui/KxMultiSelectDropdown';

const DAPP_CATEGORY_OPTIONS = categories.filter((c) => c.id !== 'all').map((c) => c.id);

export function DAppListingFiltersBar({
  selectedCategories,
  onCategoriesChange,
  selectedTags,
  onTagsChange,
  tagOptions,
  selectedCurrencies,
  onCurrenciesChange,
  currencyOptions,
}: {
  selectedCategories: Category[];
  onCategoriesChange: (next: Category[]) => void;
  selectedTags: string[];
  onTagsChange: (next: string[]) => void;
  tagOptions: string[];
  selectedCurrencies: string[];
  onCurrenciesChange: (next: string[]) => void;
  currencyOptions: string[];
}) {
  const categorySelectOptions = useMemo<KxMultiSelectOption[]>(
    () =>
      DAPP_CATEGORY_OPTIONS.map((id) => {
        const cat = categories.find((c) => c.id === id);
        return { value: id, label: cat ? `${cat.emoji} ${cat.name}` : id };
      }),
    [],
  );

  return (
    <>
      <HubCategoryMultiFilter
        values={selectedCategories}
        onChange={(next) => onCategoriesChange(next as Category[])}
        options={categorySelectOptions}
        placeholder="Category"
        filterPlaceholder="Filter categories…"
      />
      {tagOptions.length > 0 ? (
        <HubTagsMultiFilter
          values={selectedTags}
          onChange={onTagsChange}
          options={tagOptions}
          placeholder="Tags"
          filterPlaceholder="Filter tags…"
        />
      ) : null}
      <HubCryptocurrencyMultiFilter
        values={selectedCurrencies}
        onChange={onCurrenciesChange}
        options={currencyOptions}
        placeholder="Cryptocurrency"
        filterPlaceholder="Filter currencies…"
      />
    </>
  );
}
