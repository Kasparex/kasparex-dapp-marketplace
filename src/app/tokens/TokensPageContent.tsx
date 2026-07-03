'use client';

import { useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokensHero } from '@/components/tokens/TokensHero';
import { TokensListingSidebar } from '@/components/tokens/TokensListingSidebar';
import { TokenListingFiltersBar } from '@/components/tokens/TokenSortFilters';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { FilterBar } from '@/components/FilterBar';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { VIEW_MODE_OPTIONS, type ViewMode } from '@/components/SortFilters';
import { TokensBenefitsPanel } from '@/components/tokens/TokensBenefitsPanel';
import { TokensRewardsSection } from '@/components/tokens/TokensRewardsSection';
import {
  TokenListingCardGrid,
  TokenListingCompact,
  TokenListingTableView,
} from '@/components/tokens/TokenListingViews';
import type { Token, TokenNetwork } from '@/lib/tokens/types';
import {
  filterTokens,
  type TokenPremiumFilter,
} from '@/lib/tokens/listing';
import type { TokenSourceFilter } from '@/lib/tokens/source';
import type { TokenUtilitySidebarFilter } from '@/lib/tokens/utilityFilters';
import {
  resolveTokenSortControl,
  type TokenSortControlValue,
} from '@/lib/tokens/sortControls';
import type { DAppNetworkFilter } from '@/lib/dapps';
import { TOKENS_ACCENT } from '@/lib/tokens/theme';

interface TokensPageContentProps {
  tokens: Token[];
}

export function TokensPageContent({ tokens }: TokensPageContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<TokenSourceFilter>('all');
  const [networkFilter, setNetworkFilter] = useState<TokenNetwork | 'all'>('all');
  const [utilitySidebarFilter, setUtilitySidebarFilter] = useState<TokenUtilitySidebarFilter>('all');
  const [premiumFilter, setPremiumFilter] = useState<TokenPremiumFilter>('all');
  const [sortControl, setSortControl] = useState<TokenSortControlValue>('verified-first');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const { type: typeFilter, verified: verifiedFilter, sortBy } = useMemo(
    () => resolveTokenSortControl(sortControl),
    [sortControl],
  );

  const filteredAndSortedTokens = useMemo(
    () =>
      filterTokens(tokens, {
        searchQuery,
        network: networkFilter,
        type: typeFilter,
        source: sourceFilter,
        verified: verifiedFilter,
        utilitySidebar: utilitySidebarFilter,
        premium: premiumFilter,
        sortBy,
      }),
    [
      tokens,
      searchQuery,
      networkFilter,
      typeFilter,
      sourceFilter,
      verifiedFilter,
      utilitySidebarFilter,
      premiumFilter,
      sortBy,
    ],
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setNetworkFilter('all');
    setUtilitySidebarFilter('all');
    setPremiumFilter('all');
    setSortControl('verified-first');
  };

  const handleNetworkFilterChange = (value: DAppNetworkFilter) => {
    if (value === 'MULTI') {
      setNetworkFilter('all');
      return;
    }
    setNetworkFilter(value);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <TokensListingSidebar
          tokens={tokens}
          utilityFilter={utilitySidebarFilter}
          onUtilityFilterChange={setUtilitySidebarFilter}
          showUtilityFilter
        />

        <div className="min-h-[calc(100vh-4rem)] flex-1 min-w-0 overflow-y-auto border-l border-zinc-200 p-4 sm:p-6 lg:p-8 lg:pl-6 dark:border-zinc-800 font-sans text-base sm:text-[17px]">
          <div className="mx-auto max-w-7xl">
            <TokensHero sourceFilter={sourceFilter} onSourceFilterChange={setSourceFilter} />

            <div id="content" className="scroll-mt-4" />

            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex items-stretch gap-5">
                <span
                  className="w-1 shrink-0 self-stretch rounded-full shadow-[0_0_10px_rgba(2,171,184,0.35)] -skew-y-12"
                  style={{ backgroundColor: TOKENS_ACCENT }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">
                    Available tokens
                  </h2>
                  <p className="kx-body">
                    {filteredAndSortedTokens.length} token{filteredAndSortedTokens.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
              <TokensBenefitsPanel variant="compact" className="w-full sm:w-auto sm:max-w-[min(100%,42rem)]" />
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <FilterBar
                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search tokens...' }}
                onReset={handleResetFilters}
                flexWrap
              >
                <KxTabStrip
                  value={viewMode}
                  onChange={setViewMode}
                  options={VIEW_MODE_OPTIONS}
                  ariaLabel="View mode"
                  iconOnly
                />
                <NetworkSwitcher value={networkFilter} onChange={handleNetworkFilterChange} />
                <TokenListingFiltersBar
                  sortControl={sortControl}
                  onSortControlChange={setSortControl}
                  premiumFilter={premiumFilter}
                  onPremiumFilterChange={setPremiumFilter}
                />
              </FilterBar>
            </div>

            {viewMode === 'table' ? (
              <TokenListingTableView tokens={tokens} displayTokens={filteredAndSortedTokens} />
            ) : viewMode === 'compact' ? (
              <TokenListingCompact tokens={filteredAndSortedTokens} />
            ) : (
              <TokenListingCardGrid tokens={filteredAndSortedTokens} />
            )}

            <div className="mt-10 mb-16">
              <TokensRewardsSection />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
