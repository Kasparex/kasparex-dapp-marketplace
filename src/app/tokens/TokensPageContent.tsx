'use client';

import { useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokensHero } from '@/components/tokens/TokensHero';
import { TokensListingSidebar } from '@/components/tokens/TokensListingSidebar';
import { TokenListingFiltersBar } from '@/components/tokens/TokenSortFilters';
import { TokenTypeSwitcher } from '@/components/tokens/TokenTypeSwitcher';
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
import type { Token, TokenNetwork, TokenType } from '@/lib/tokens/types';
import { TokenLedgerDashboard } from '@/components/tokens/TokenLedgerDashboard';
import { getTokenLedger } from '@/lib/tokens/ledger';
import {
  filterTokens,
  type TokenPremiumFilter,
  type TokenSortOption,
  type TokenUtilityFilter,
  type TokenVerifiedFilter,
} from '@/lib/tokens/listing';
import { TOKENS_ACCENT } from '@/lib/tokens/theme';

interface TokensPageContentProps {
  tokens: Token[];
}

export function TokensPageContent({ tokens }: TokensPageContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TokenType | 'all'>('all');
  const [networkFilter, setNetworkFilter] = useState<TokenNetwork | 'all'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<TokenVerifiedFilter>('all');
  const [utilityFilter, setUtilityFilter] = useState<TokenUtilityFilter>('all');
  const [premiumFilter, setPremiumFilter] = useState<TokenPremiumFilter>('all');
  const [sortBy, setSortBy] = useState<TokenSortOption>('verified-first');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const filteredAndSortedTokens = useMemo(
    () =>
      filterTokens(tokens, {
        searchQuery,
        network: networkFilter,
        type: typeFilter,
        verified: verifiedFilter,
        utility: utilityFilter,
        premium: premiumFilter,
        sortBy,
      }),
    [tokens, searchQuery, networkFilter, typeFilter, verifiedFilter, utilityFilter, premiumFilter, sortBy],
  );

  const gridLedger = useMemo(() => getTokenLedger('grid'), []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setNetworkFilter('all');
    setVerifiedFilter('all');
    setUtilityFilter('all');
    setPremiumFilter('all');
    setSortBy('verified-first');
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <TokensListingSidebar />

        <div className="min-h-[calc(100vh-4rem)] flex-1 min-w-0 overflow-y-auto border-l border-zinc-200 p-4 sm:p-6 lg:p-8 lg:pl-6 dark:border-zinc-800 font-sans text-base sm:text-[17px]">
          <div className="mx-auto max-w-7xl">
            <TokensHero />

            <div id="content" className="scroll-mt-4" />

            <div className="mb-10">
              <TokenLedgerDashboard snapshot={gridLedger} />
            </div>

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
                <NetworkSwitcher value={networkFilter as TokenNetwork | 'all'} onChange={setNetworkFilter as (v: TokenNetwork | 'all') => void} />
                <TokenTypeSwitcher value={typeFilter} onChange={setTypeFilter} />
                <TokenListingFiltersBar
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  verifiedFilter={verifiedFilter}
                  onVerifiedFilterChange={setVerifiedFilter}
                  utilityFilter={utilityFilter}
                  onUtilityFilterChange={setUtilityFilter}
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
