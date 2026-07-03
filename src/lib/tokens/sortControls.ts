import type { TokenSortOption, TokenVerifiedFilter } from '@/lib/tokens/listing';
import type { TokenType } from '@/lib/tokens/types';

export type TokenSortControlValue =
  | 'all-tokens'
  | 'global-tokens'
  | 'collab-tokens'
  | 'verified-only'
  | TokenSortOption;

export const TOKEN_SORT_CONTROL_OPTIONS: { value: TokenSortControlValue; label: string }[] = [
  { value: 'all-tokens', label: 'All tokens' },
  { value: 'global-tokens', label: 'Global tokens' },
  { value: 'collab-tokens', label: 'Collab tokens' },
  { value: 'verified-only', label: 'Verified only' },
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
  type: TokenType | 'all';
  verified: TokenVerifiedFilter;
  sortBy: TokenSortOption;
} {
  switch (value) {
    case 'all-tokens':
      return { type: 'all', verified: 'all', sortBy: 'name-az' };
    case 'global-tokens':
      return { type: 'global', verified: 'all', sortBy: 'name-az' };
    case 'collab-tokens':
      return { type: 'collab', verified: 'all', sortBy: 'name-az' };
    case 'verified-only':
      return { type: 'all', verified: 'verified', sortBy: 'verified-first' };
    default:
      return { type: 'all', verified: 'all', sortBy: value };
  }
}
