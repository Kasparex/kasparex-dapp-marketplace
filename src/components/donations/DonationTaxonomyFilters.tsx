'use client';

import { useMemo } from 'react';
import { DONATION_CATEGORIES } from '@/lib/donations/categories';
import {
  HubCategoryMultiFilter,
  HubCryptocurrencyMultiFilter,
  HubTagsMultiFilter,
} from '@/components/hub/HubMultiSelectFilters';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { CROWDKAS_LISTING_CURRENCIES } from '@/lib/hub/listingCurrencies';

export type DonationNetworkFilterValue = 'all' | 'l1' | 'l2';

export function DonationNetworkFilter({
  value,
  onChange,
}: {
  value: DonationNetworkFilterValue;
  onChange: (value: DonationNetworkFilterValue) => void;
}) {
  return (
    <KxFilterDropdown
      value={value}
      onChange={onChange}
      options={[
        { value: 'all', label: 'All networks' },
        { value: 'l1', label: 'Kaspa L1 (covenant + tips)' },
        { value: 'l2', label: 'L2 escrow (Igra)' },
      ]}
      ariaLabel="Filter by network"
      triggerClassName="k-control-btn min-w-[160px] h-10"
      menuClassName="w-64"
    />
  );
}

export function DonationCategoryFilter({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <HubCategoryMultiFilter
      values={values}
      onChange={onChange}
      options={[...DONATION_CATEGORIES]}
      placeholder="Category"
      filterPlaceholder="Filter categories…"
      triggerClassName="k-control-btn min-w-[160px] h-10"
    />
  );
}

export function DonationTagMultiFilter({
  allTags,
  selectedTags,
  onChange,
}: {
  allTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}) {
  if (allTags.length === 0) return null;

  return (
    <HubTagsMultiFilter
      values={selectedTags}
      onChange={onChange}
      options={allTags}
      placeholder="Tags"
      filterPlaceholder="Filter tags…"
    />
  );
}

export function DonationCryptocurrencyFilter({
  values,
  onChange,
  options = [...CROWDKAS_LISTING_CURRENCIES],
}: {
  values: string[];
  onChange: (values: string[]) => void;
  options?: string[];
}) {
  const currencyOptions = useMemo(() => options, [options]);

  return (
    <HubCryptocurrencyMultiFilter
      values={values}
      onChange={onChange}
      options={currencyOptions}
      placeholder="Cryptocurrency"
      filterPlaceholder="Filter currencies…"
    />
  );
}
