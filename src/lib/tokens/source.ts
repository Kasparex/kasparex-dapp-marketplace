import type { Token } from '@/lib/tokens/types';

export type TokenSourceFilter = 'all' | 'kasparex' | 'community' | 'developer';

export type TokenListSource = 'kasparex' | 'community' | 'developer';

/** Who listed the token in the Kasparex directory. */
export function getTokenListSource(token: Token): TokenListSource {
  if (token.type === 'global') return 'kasparex';
  if (token.listing?.deployerVerified) return 'developer';
  return 'community';
}

export function matchesTokenSourceFilter(token: Token, filter: TokenSourceFilter): boolean {
  if (filter === 'all') return true;
  return getTokenListSource(token) === filter;
}
