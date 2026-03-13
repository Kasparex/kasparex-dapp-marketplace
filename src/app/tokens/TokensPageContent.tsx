'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokensHero } from '@/components/tokens/TokensHero';
import { TokensListingSidebar } from '@/components/tokens/TokensListingSidebar';
import { TokenListingTable, type TokenSortField, type TokenSortDirection } from '@/components/tokens/TokenListingTable';
import { TokenSortFilters } from '@/components/tokens/TokenSortFilters';
import { TokenTypeSwitcher } from '@/components/tokens/TokenTypeSwitcher';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';

interface TokensPageContentProps {
  tokens: Token[];
}

export function TokensPageContent({ tokens }: TokensPageContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TokenType | 'all'>('all');
  const [networkFilter, setNetworkFilter] = useState<TokenNetwork | 'all'>('all');
  const [sortField, setSortField] = useState<TokenSortField>('name');
  const [sortDirection, setSortDirection] = useState<TokenSortDirection>('asc');

  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens.filter((token) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !token.name.toLowerCase().includes(q) &&
          !token.symbol.toLowerCase().includes(q) &&
          !token.description?.toLowerCase().includes(q)
        ) return false;
      }
      if (networkFilter !== 'all' && token.network !== networkFilter) return false;
      if (typeFilter !== 'all' && token.type !== typeFilter) return false;
      return true;
    });

    filtered.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      switch (sortField) {
        case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
        case 'symbol': aVal = a.symbol.toLowerCase(); bVal = b.symbol.toLowerCase(); break;
        case 'price': aVal = a.price?.current ?? 0; bVal = b.price?.current ?? 0; break;
        case 'marketCap': aVal = a.price?.marketCap ?? 0; bVal = b.price?.marketCap ?? 0; break;
        case 'network': aVal = a.network; bVal = b.network; break;
        case 'type': aVal = a.type; bVal = b.type; break;
        default: return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [tokens, searchQuery, typeFilter, networkFilter, sortField, sortDirection]);

  const handleSort = (field: TokenSortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSortChange = (field: TokenSortField, direction: TokenSortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setNetworkFilter('all');
    setSortField('name');
    setSortDirection('asc');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row">
        <TokensListingSidebar />

        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="max-w-7xl mx-auto">
            <TokensHero />

            <div id="content" className="scroll-mt-4" />

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                Available Tokens
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {filteredAndSortedTokens.length} token{filteredAndSortedTokens.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <FilterBar
                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search tokens...' }}
                onReset={handleResetFilters}
              >
                <NetworkSwitcher value={networkFilter as any} onChange={setNetworkFilter as any} />
                <TokenTypeSwitcher value={typeFilter} onChange={setTypeFilter} />
                <TokenSortFilters
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                />
              </FilterBar>
            </div>

            <TokenListingTable
              tokens={tokens}
              displayTokens={filteredAndSortedTokens}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
