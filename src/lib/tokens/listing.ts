import type { Token, TokenNetwork, TokenType } from '@/lib/tokens/types';
import type { TokenSourceFilter } from '@/lib/tokens/source';
import { matchesTokenSourceFilter } from '@/lib/tokens/source';
import { matchesTokenTags } from '@/lib/tokens/tags';
import { matchesTokenUtilitySidebarFilter } from '@/lib/tokens/utilityFilters';

export type TokenSortOption =
  | 'name-az'
  | 'name-za'
  | 'symbol-az'
  | 'symbol-za'
  | 'price-high'
  | 'price-low'
  | 'market-cap-high'
  | 'market-cap-low'
  | 'verified-first'
  | 'featured-first'
  | 'utility-first'
  | 'activity-high'
  | 'network'
  | 'type';

export type TokenVerifiedFilter = 'all' | 'verified';
export type TokenUtilityFilter = 'all' | 'utility-enabled';
export type TokenPremiumFilter = 'all' | 'featured';

export interface TokenListingFilters {
  searchQuery: string;
  network: TokenNetwork | 'all';
  type: TokenType | 'all';
  source: TokenSourceFilter;
  verified: TokenVerifiedFilter;
  utilitySidebar: TokenUtilitySidebarFilter;
  premium: TokenPremiumFilter;
  selectedTags: string[];
  sortBy: TokenSortOption;
}

export function tokenIsVerified(token: Token): boolean {
  return Boolean(token.listing?.verified);
}

export function tokenHasUtility(token: Token): boolean {
  return Boolean(token.listing?.instantUtility);
}

export function tokenIsFeatured(token: Token): boolean {
  return Boolean(token.listing?.featured);
}

export function getTokenActivityScore(token: Token): number {
  return token.listing?.activityScore ?? 0;
}

export function getTokenCommunityScore(token: Token): number {
  return token.listing?.communityScore ?? 0;
}

export function filterTokens(tokens: Token[], filters: TokenListingFilters): Token[] {
  let filtered = [...tokens];

  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (token) =>
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.description?.toLowerCase().includes(query) ||
        token.tags?.some((tag) => tag.toLowerCase().includes(query)),
    );
  }

  if (filters.network !== 'all') {
    filtered = filtered.filter((token) => token.network === filters.network);
  }

  if (filters.type !== 'all') {
    filtered = filtered.filter((token) => token.type === filters.type);
  }

  if (filters.source !== 'all') {
    filtered = filtered.filter((token) => matchesTokenSourceFilter(token, filters.source));
  }

  if (filters.verified === 'verified') {
    filtered = filtered.filter(tokenIsVerified);
  }

  if (filters.utilitySidebar !== 'all') {
    filtered = filtered.filter((token) => matchesTokenUtilitySidebarFilter(token, filters.utilitySidebar));
  }

  if (filters.premium === 'featured') {
    filtered = filtered.filter(tokenIsFeatured);
  }

  if (filters.selectedTags.length > 0) {
    filtered = filtered.filter((token) => matchesTokenTags(token, filters.selectedTags));
  }

  return sortTokens(filtered, filters.sortBy);
}

export function sortTokens(tokens: Token[], sortBy: TokenSortOption): Token[] {
  const sorted = [...tokens];

  sorted.sort((a, b) => {
    if (sortBy === 'verified-first') {
      const aV = tokenIsVerified(a) ? 1 : 0;
      const bV = tokenIsVerified(b) ? 1 : 0;
      if (bV !== aV) return bV - aV;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'featured-first') {
      const aF = tokenIsFeatured(a) ? 1 : 0;
      const bF = tokenIsFeatured(b) ? 1 : 0;
      if (bF !== aF) return bF - aF;
      return getTokenActivityScore(b) - getTokenActivityScore(a);
    }
    if (sortBy === 'utility-first') {
      const aU = tokenHasUtility(a) ? 1 : 0;
      const bU = tokenHasUtility(b) ? 1 : 0;
      if (bU !== aU) return bU - aU;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'activity-high') {
      return getTokenActivityScore(b) - getTokenActivityScore(a);
    }
    if (sortBy === 'name-az') return a.name.localeCompare(b.name);
    if (sortBy === 'name-za') return b.name.localeCompare(a.name);
    if (sortBy === 'symbol-az') return a.symbol.localeCompare(b.symbol);
    if (sortBy === 'symbol-za') return b.symbol.localeCompare(a.symbol);
    if (sortBy === 'price-high') {
      return (b.price?.current ?? 0) - (a.price?.current ?? 0);
    }
    if (sortBy === 'price-low') {
      return (a.price?.current ?? 0) - (b.price?.current ?? 0);
    }
    if (sortBy === 'market-cap-high') {
      return (b.price?.marketCap ?? 0) - (a.price?.marketCap ?? 0);
    }
    if (sortBy === 'market-cap-low') {
      return (a.price?.marketCap ?? 0) - (b.price?.marketCap ?? 0);
    }
    if (sortBy === 'network') {
      return a.network.localeCompare(b.network) || a.name.localeCompare(b.name);
    }
    if (sortBy === 'type') {
      return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
    }
    return 0;
  });

  return sorted;
}
