'use client';

import {
  HubCryptoMultiFilter,
} from '@/components/hub/HubMultiSelectFilters';
import { VBlogSortFilters, type VBlogSortOption } from '@/components/vblog/VBlogSortFilters';
import type { VBlogMagazineFilter, VBlogPremiumFilter } from '@/lib/vblog/listing';
import { KxMultiSelectDropdown } from '@/components/ui/KxMultiSelectDropdown';
import { useMemo } from 'react';

const MAGAZINE_OPTIONS: { value: VBlogMagazineFilter; label: string }[] = [
  { value: 'all', label: 'All articles' },
  { value: 'linked', label: 'Magazine linked' },
  { value: 'standalone', label: 'Standalone only' },
];

const PREMIUM_OPTIONS: { value: VBlogPremiumFilter; label: string }[] = [
  { value: 'all', label: 'All content' },
  { value: 'premium', label: 'Premium only' },
  { value: 'standard', label: 'Standard only' },
];

export function VBlogListingFiltersBar({
  sortBy,
  onSortChange,
  magazineFilter,
  onMagazineFilterChange,
  premiumFilter,
  onPremiumFilterChange,
  selectedCurrencies,
  onCurrenciesChange,
  currencyOptions,
}: {
  sortBy: VBlogSortOption;
  onSortChange: (sort: VBlogSortOption) => void;
  magazineFilter: VBlogMagazineFilter;
  onMagazineFilterChange: (value: VBlogMagazineFilter) => void;
  premiumFilter: VBlogPremiumFilter;
  onPremiumFilterChange: (value: VBlogPremiumFilter) => void;
  selectedCurrencies: string[];
  onCurrenciesChange: (next: string[]) => void;
  currencyOptions: string[];
}) {
  const magazineValues = useMemo(
    () => (magazineFilter === 'all' ? [] : [magazineFilter]),
    [magazineFilter],
  );
  const premiumValues = useMemo(
    () => (premiumFilter === 'all' ? [] : [premiumFilter]),
    [premiumFilter],
  );

  return (
    <>
      <HubCryptoMultiFilter
        values={selectedCurrencies}
        onChange={onCurrenciesChange}
        options={currencyOptions}
      />
      <KxMultiSelectDropdown
        values={magazineValues}
        onChange={(next) => {
          if (next.length === 0) onMagazineFilterChange('all');
          else onMagazineFilterChange(next[next.length - 1] as VBlogMagazineFilter);
        }}
        options={MAGAZINE_OPTIONS.filter((o) => o.value !== 'all')}
        ariaLabel="Filter by magazine linkage"
        placeholder="Magazine"
        filterPlaceholder="Filter magazine…"
        showFilter
        triggerClassName="k-control-btn min-w-[150px] h-10"
        menuClassName="w-64"
      />
      <KxMultiSelectDropdown
        values={premiumValues}
        onChange={(next) => {
          if (next.length === 0) onPremiumFilterChange('all');
          else onPremiumFilterChange(next[next.length - 1] as VBlogPremiumFilter);
        }}
        options={PREMIUM_OPTIONS.filter((o) => o.value !== 'all')}
        ariaLabel="Filter by premium content"
        placeholder="Premium"
        filterPlaceholder="Filter premium…"
        showFilter
        triggerClassName="k-control-btn min-w-[140px] h-10"
        menuClassName="w-64"
      />
      <VBlogSortFilters sortBy={sortBy} onSortChange={onSortChange} />
    </>
  );
}
