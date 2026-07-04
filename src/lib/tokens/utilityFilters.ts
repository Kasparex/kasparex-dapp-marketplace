import type { Token } from '@/lib/tokens/types';
import { TOKEN_MODULE_OFFERS } from '@/lib/tokens/modules';

export type TokenUtilitySidebarFilter = 'all' | 'utility-enabled' | `module:${string}` | `badge:${string}`;

export type TokenUtilitySectionFilter = 'all' | 'utility-enabled' | `badge:${string}`;
export type TokenModuleSectionFilter = 'all' | `module:${string}`;

export function buildTokenUtilitySectionItems(tokens: Token[]) {
  const badgeCounts = new Map<string, number>();
  for (const token of tokens) {
    for (const badge of token.listing?.utilityBadges ?? []) {
      badgeCounts.set(badge, (badgeCounts.get(badge) ?? 0) + 1);
    }
  }

  const items: { id: TokenUtilitySectionFilter; label: string; count?: number }[] = [
    { id: 'all', label: 'All utility' },
    {
      id: 'utility-enabled',
      label: 'Utility enabled',
      count: tokens.filter((t) => t.listing?.instantUtility).length,
    },
  ];

  for (const [badge, count] of Array.from(badgeCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    items.push({ id: `badge:${badge}`, label: badge, count });
  }

  return items;
}

export function buildTokenModuleSectionItems() {
  const items: { id: TokenModuleSectionFilter; label: string }[] = [{ id: 'all', label: 'All modules' }];

  for (const offer of TOKEN_MODULE_OFFERS) {
    items.push({
      id: `module:${offer.id}`,
      label: offer.title,
    });
  }

  return items;
}

export function resolveTokenSidebarFilter(
  utilityFilter: TokenUtilitySectionFilter,
  moduleFilter: TokenModuleSectionFilter,
): TokenUtilitySidebarFilter {
  if (moduleFilter !== 'all') return moduleFilter;
  return utilityFilter;
}

export function matchesTokenUtilitySidebarFilter(token: Token, filter: TokenUtilitySidebarFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'utility-enabled') return Boolean(token.listing?.instantUtility);
  if (filter.startsWith('module:')) {
    const moduleId = filter.slice('module:'.length);
    return (token.paidModuleIds ?? []).includes(moduleId as import('./modules').TokenModuleId);
  }
  if (filter.startsWith('badge:')) {
    const badge = filter.slice('badge:'.length);
    return token.listing?.utilityBadges?.includes(badge) ?? false;
  }
  return true;
}

/** @deprecated Use buildTokenUtilitySectionItems */
export function buildTokenUtilityFilterItems(tokens: Token[]) {
  return buildTokenUtilitySectionItems(tokens);
}
