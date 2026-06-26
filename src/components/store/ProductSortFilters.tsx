'use client';

import type { SortOption } from '@/lib/store/sorting';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';

interface ProductSortFiltersProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

export function ProductSortFilters({ sortBy, onSortChange }: ProductSortFiltersProps) {
  return (
    <KxFilterDropdown
      value={sortBy}
      onChange={onSortChange}
      options={sortOptions}
      ariaLabel="Sort products"
    />
  );
}
