import type { Token } from '@/lib/tokens/types';
import type { TokenSourceFilter } from '@/lib/tokens/source';
import { matchesTokenSourceFilter } from '@/lib/tokens/source';
import { matchesTokenTags } from '@/lib/tokens/tags';
import { matchesTokenUtilitySidebarFilter, type TokenUtilitySidebarFilter } from '@/lib/tokens/utilityFilters';
import { getListingVoteScore } from '@/lib/tokens/votes';
import { getTokenCategory } from '@/lib/tokens/categories';
import { resolveTokenCreatorWallet } from '@/lib/tokens/creatorWallet';
import { matchesTokenNetworkFilter, type TokenNetworkFilter } from '@/lib/tokens/networks';

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
  | 'community-high'
  | 'network'
  | 'type';

export type TokenVerifiedFilter = 'all' | 'verified';
export type TokenUtilityFilter = 'all' | 'utility-enabled';
export type TokenListingsFilter =
  | 'all'
  | 'global'
  | 'collab'
  | 'verified'
  | 'non-verified'
  | 'featured';

/** @deprecated Use TokenListingsFilter */
export type TokenPremiumFilter = 'all' | 'featured';

export interface TokenListingFilters {
  searchQuery: string;
  network: TokenNetworkFilter;
  source: TokenSourceFilter;
  listings: TokenListingsFilter;
  category: string | null;
  utilitySidebar: TokenUtilitySidebarFilter;
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
  const base = token.listing?.communityScore ?? 0;
  return base + getListingVoteScore(token.id);
}

export function filterTokens(tokens: Token[], filters: TokenListingFilters): Token[] {
  let filtered = [...tokens];

  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();
    const authorQuery = query.replace(/^(evm:|kaspa:)/, '');
    filtered = filtered.filter((token) => {
      const creator = resolveTokenCreatorWallet(token);
      const category = getTokenCategory(token).toLowerCase();
      return (
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.description?.toLowerCase().includes(query) ||
        category.includes(query) ||
        token.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
        (creator ? creator.toLowerCase().includes(authorQuery) : false)
      );
    });
  }

  if (filters.network !== 'all') {
    filtered = filtered.filter((token) => matchesTokenNetworkFilter(token, filters.network));
  }

  if (filters.listings === 'global') {
    filtered = filtered.filter((token) => token.type === 'global');
  } else if (filters.listings === 'collab') {
    filtered = filtered.filter((token) => token.type === 'collab');
  } else if (filters.listings === 'verified') {
    filtered = filtered.filter(tokenIsVerified);
  } else if (filters.listings === 'non-verified') {
    filtered = filtered.filter((token) => !tokenIsVerified(token));
  } else if (filters.listings === 'featured') {
    filtered = filtered.filter(tokenIsFeatured);
  }

  if (filters.category) {
    filtered = filtered.filter((token) => getTokenCategory(token) === filters.category);
  }

  if (filters.source !== 'all') {
    filtered = filtered.filter((token) => matchesTokenSourceFilter(token, filters.source));
  }

  if (filters.utilitySidebar !== 'all') {
    filtered = filtered.filter((token) => matchesTokenUtilitySidebarFilter(token, filters.utilitySidebar));
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
      const voteDiff = getTokenCommunityScore(b) - getTokenCommunityScore(a);
      if (voteDiff !== 0) return voteDiff;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'featured-first') {
      const aF = tokenIsFeatured(a) ? 1 : 0;
      const bF = tokenIsFeatured(b) ? 1 : 0;
      if (bF !== aF) return bF - aF;
      const voteDiff = getTokenCommunityScore(b) - getTokenCommunityScore(a);
      if (voteDiff !== 0) return voteDiff;
      return getTokenActivityScore(b) - getTokenActivityScore(a);
    }
    if (sortBy === 'utility-first') {
      const aU = tokenHasUtility(a) ? 1 : 0;
      const bU = tokenHasUtility(b) ? 1 : 0;
      if (bU !== aU) return bU - aU;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'activity-high') {
      const voteDiff = getTokenCommunityScore(b) - getTokenCommunityScore(a);
      if (voteDiff !== 0) return voteDiff;
      return getTokenActivityScore(b) - getTokenActivityScore(a);
    }
    if (sortBy === 'community-high') {
      const voteDiff = getTokenCommunityScore(b) - getTokenCommunityScore(a);
      if (voteDiff !== 0) return voteDiff;
      return getTokenActivityScore(b) - getTokenActivityScore(a) || a.name.localeCompare(b.name);
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
