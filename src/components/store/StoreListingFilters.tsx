'use client';

import { useMemo } from 'react';
import { KxMultiSelectDropdown } from '@/components/ui/KxMultiSelectDropdown';
import type { ProductCategory } from '@/lib/store/types';
import type { StorePaymentCurrency } from '@/lib/store/currencies';

const STORE_CATEGORIES: ProductCategory[] = ['Software', 'Art', 'Music', 'Templates', 'Other'];

export function StoreListingFilters({
  selectedCategories,
  onCategoriesChange,
  selectedCurrencies,
  onCurrenciesChange,
  currencyOptions,
}: {
  selectedCategories: ProductCategory[];
  onCategoriesChange: (next: ProductCategory[]) => void;
  selectedCurrencies: StorePaymentCurrency[];
  onCurrenciesChange: (next: StorePaymentCurrency[]) => void;
  currencyOptions: StorePaymentCurrency[];
}) {
  const categoryOptions = useMemo(
    () => STORE_CATEGORIES.map((category) => ({ value: category, label: category })),
    [],
  );

  const cryptoOptions = useMemo(
    () => currencyOptions.map((currency) => ({ value: currency, label: currency })),
    [currencyOptions],
  );

  return (
    <div className="contents">
      <KxMultiSelectDropdown
        values={selectedCategories}
        onChange={(next) => onCategoriesChange(next as ProductCategory[])}
        options={categoryOptions}
        ariaLabel="Filter by category"
        placeholder="Category"
        filterPlaceholder="Filter categories…"
        showFilter
        accent="store"
        triggerClassName="k-control-btn min-w-[140px] h-10"
        menuClassName="w-64"
      />
      <KxMultiSelectDropdown
        values={selectedCurrencies}
        onChange={(next) => onCurrenciesChange(next as StorePaymentCurrency[])}
        options={cryptoOptions}
        ariaLabel="Filter by cryptocurrency"
        placeholder="Cryptocurrency"
        filterPlaceholder="Filter currencies…"
        showFilter
        accent="store"
        triggerClassName="k-control-btn min-w-[160px] h-10"
        menuClassName="w-64"
      />
    </div>
  );
}
