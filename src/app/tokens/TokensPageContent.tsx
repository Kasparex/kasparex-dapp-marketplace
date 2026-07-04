'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import type { Token } from '@/lib/tokens/types';
import {
  filterTokens,
  type TokenListingsFilter,
} from '@/lib/tokens/listing';
import type { TokenSourceFilter } from '@/lib/tokens/source';
import {
  resolveTokenSidebarFilter,
  type TokenModuleSectionFilter,
  type TokenUtilitySectionFilter,
} from '@/lib/tokens/utilityFilters';
import {
  resolveTokenSortControl,
  type TokenSortControlValue,
} from '@/lib/tokens/sortControls';
import type { DAppNetworkFilter } from '@/lib/dapps';
import type { TokenNetworkFilter } from '@/lib/tokens/networks';
import { TOKENS_ACCENT } from '@/lib/tokens/theme';
import { useTokens } from '@/hooks/useTokens';
import { TOKEN_LISTING_VOTES_CHANGED_EVENT } from '@/lib/tokens/votes';

interface TokensPageContentProps {
  tokens: Token[];
}

export function TokensPageContent({ tokens }: TokensPageContentProps) {
  const searchParams = useSearchParams();
  const { getMergedTokens, listings } = useTokens();
  const allTokens = useMemo(() => getMergedTokens(tokens), [tokens, getMergedTokens, listings]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<TokenSourceFilter>('all');
  const [networkFilter, setNetworkFilter] = useState<TokenNetworkFilter>('all');
  const [listingsFilter, setListingsFilter] = useState<TokenListingsFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [utilitySectionFilter, setUtilitySectionFilter] = useState<TokenUtilitySectionFilter>('all');
  const [moduleSectionFilter, setModuleSectionFilter] = useState<TokenModuleSectionFilter>('all');
  const [sortControl, setSortControl] = useState<TokenSortControlValue>('community-high');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [voteTick, setVoteTick] = useState(0);

  useEffect(() => {
    const onVotesChanged = () => setVoteTick((t) => t + 1);
    window.addEventListener(TOKEN_LISTING_VOTES_CHANGED_EVENT, onVotesChanged);
    return () => window.removeEventListener(TOKEN_LISTING_VOTES_CHANGED_EVENT, onVotesChanged);
  }, []);

  useEffect(() => {
    const tagParam = searchParams.get('tag');
    if (tagParam) {
      setSelectedTags([tagParam]);
    }
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  const utilitySidebarFilter = useMemo(
    () => resolveTokenSidebarFilter(utilitySectionFilter, moduleSectionFilter),
    [utilitySectionFilter, moduleSectionFilter],
  );

  const { sortBy } = useMemo(() => resolveTokenSortControl(sortControl), [sortControl]);

  const filteredAndSortedTokens = useMemo(
    () =>
      filterTokens(allTokens, {
        searchQuery,
        network: networkFilter,
        source: sourceFilter,
        listings: listingsFilter,
        category: selectedCategory,
        utilitySidebar: utilitySidebarFilter,
        selectedTags,
        sortBy,
      }),
    [
      allTokens,
      searchQuery,
      networkFilter,
      sourceFilter,
      listingsFilter,
      selectedCategory,
      utilitySidebarFilter,
      selectedTags,
      sortBy,
      voteTick,
    ],
  );

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleUtilitySectionChange = (value: TokenUtilitySectionFilter) => {
    setModuleSectionFilter('all');
    setUtilitySectionFilter(value);
  };

  const handleModuleSectionChange = (value: TokenModuleSectionFilter) => {
    setUtilitySectionFilter('all');
    setModuleSectionFilter(value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setNetworkFilter('all');
    setListingsFilter('all');
    setSelectedCategory(null);
    setUtilitySectionFilter('all');
    setModuleSectionFilter('all');
    setSortControl('community-high');
    setSelectedTags([]);
  };

  const handleNetworkFilterChange = (value: DAppNetworkFilter) => {
    setNetworkFilter(value);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <TokensListingSidebar
          tokens={allTokens}
          utilityFilter={utilitySectionFilter}
          moduleFilter={moduleSectionFilter}
          onUtilityFilterChange={handleUtilitySectionChange}
          onModuleFilterChange={handleModuleSectionChange}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
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
                search={{
                  value: searchQuery,
                  onChange: setSearchQuery,
                  placeholder: 'Search by name, ticker, tag, wallet address, or category...',
                }}
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
                  listingsFilter={listingsFilter}
                  onListingsFilterChange={setListingsFilter}
                />
              </FilterBar>
            </div>

            {viewMode === 'table' ? (
              <TokenListingTableView tokens={allTokens} displayTokens={filteredAndSortedTokens} />
            ) : viewMode === 'compact' ? (
              <TokenListingCompact tokens={filteredAndSortedTokens} />
            ) : (
              <TokenListingCardGrid
                tokens={filteredAndSortedTokens}
                onCategoryFilter={setSelectedCategory}
              />
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
