import type { TokenSortOption } from '@/lib/tokens/listing';

export type TokenSortControlValue = TokenSortOption;

export const TOKEN_SORT_CONTROL_OPTIONS: { value: TokenSortControlValue; label: string }[] = [
  { value: 'community-high', label: 'Most community support' },
  { value: 'verified-first', label: 'Verified first' },
  { value: 'featured-first', label: 'Featured first' },
  { value: 'utility-first', label: 'Utility enabled first' },
  { value: 'activity-high', label: 'Highest activity' },
  { value: 'name-az', label: 'Name (A-Z)' },
  { value: 'name-za', label: 'Name (Z-A)' },
  { value: 'symbol-az', label: 'Symbol (A-Z)' },
  { value: 'price-high', label: 'Price (high to low)' },
  { value: 'price-low', label: 'Price (low to high)' },
  { value: 'market-cap-high', label: 'Market cap (high to low)' },
  { value: 'network', label: 'Network' },
  { value: 'type', label: 'Type' },
];

export function resolveTokenSortControl(value: TokenSortControlValue): {
  sortBy: TokenSortOption;
} {
  return { sortBy: value };
}
