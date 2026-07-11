'use client';

import {
  HubCategoryMultiFilter,
  HubCryptoMultiFilter,
  HubTagsMultiFilter,
} from '@/components/hub/HubMultiSelectFilters';
import { MagazineSortFilters } from '@/components/magazines/MagazineSortFilters';
import type { MagazineSortOption } from '@/lib/magazines/types';

export function MagazineListingFiltersBar({
  categories,
  selectedCategories,
  onCategoriesChange,
  tagOptions,
  selectedTags,
  onTagsChange,
  currencyOptions,
  selectedCurrencies,
  onCurrenciesChange,
  sortBy,
  onSortChange,
}: {
  categories: string[];
  selectedCategories: string[];
  onCategoriesChange: (next: string[]) => void;
  tagOptions: string[];
  selectedTags: string[];
  onTagsChange: (next: string[]) => void;
  currencyOptions: string[];
  selectedCurrencies: string[];
  onCurrenciesChange: (next: string[]) => void;
  sortBy: MagazineSortOption;
  onSortChange: (sort: MagazineSortOption) => void;
}) {
  const categoryOptions = categories.filter((c) => c !== 'All');

  return (
    <>
      {categoryOptions.length > 0 ? (
        <HubCategoryMultiFilter
          values={selectedCategories}
          onChange={onCategoriesChange}
          options={categoryOptions}
          placeholder="Category"
          filterPlaceholder="Filter categories…"
        />
      ) : null}
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
      <MagazineSortFilters sortBy={sortBy} onSortChange={onSortChange} />
    </>
  );
}
