'use client';

import { useState, useEffect, useMemo } from 'react';
import { StoreHeader } from '@/components/store/StoreHeader';
import { StorePageShell } from '@/components/store/StorePageShell';
import { ProductGrid } from '@/components/store/ProductGrid';
import { getAllProducts } from '@/lib/store/products';
import { getCategoryCounts, getListedCurrencies, filterProducts } from '@/lib/store/filtering';
import { getProductTagsFromCatalog } from '@/lib/store/tags';
import { ProductSortFilters } from '@/components/store/ProductSortFilters';
import { StoreListingFilters } from '@/components/store/StoreListingFilters';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { FilterBar } from '@/components/FilterBar';
import { sortProducts, type SortOption } from '@/lib/store/sorting';
import type { ProductCategory, ProductNetwork } from '@/lib/store/types';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { StoreBuyerBenefitsPanel } from '@/components/store/StoreBuyerBenefitsPanel';
import { bootstrapHubContent } from '@/lib/hub/contentSync';

export type ProductViewMode = 'grid' | 'compact' | 'table';

export default function StorePage() {
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getAllProducts>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<StorePaymentCurrency[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<ProductNetwork | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ProductViewMode>('grid');

  const categoryCounts = useMemo(() => getCategoryCounts(products), [products]);
  const listedCurrencies = useMemo(() => getListedCurrencies(products), [products]);
  const allTags = useMemo(() => getProductTagsFromCatalog(products), [products]);

  useEffect(() => {
    void bootstrapHubContent(['tokens', 'store']).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allProducts = await getAllProducts();
        if (!cancelled) setProducts(allProducts);
      } catch (err) {
        console.error('Failed to load products:', err);
        if (!cancelled) setError('Failed to load products. Please try again later.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = filterProducts(products, {
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      network: selectedNetwork,
      currencies: selectedCurrencies.length > 0 ? selectedCurrencies : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      search: searchQuery || undefined,
    });
    return sortProducts(filtered, sortBy);
  }, [products, selectedCategories, selectedCurrencies, selectedTags, selectedNetwork, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedCurrencies([]);
    setSelectedTags([]);
    setSelectedNetwork('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedCurrencies.length > 0 ||
    selectedTags.length > 0 ||
    selectedNetwork !== 'all' ||
    searchQuery.length > 0 ||
    sortBy !== 'newest';

  return (
    <StorePageShell
      sidebar={{
        mode: 'listing',
        categories: ['Software', 'Art', 'Music', 'Templates', 'Other'],
        selectedCategories,
        onCategoryChange: setSelectedCategories,
        categoryCounts,
        allTags,
        selectedTags,
        onTagToggle: handleTagToggle,
      }}
    >
      <StoreHeader />

      <div id="content" className="scroll-mt-4" />

      <HubListingTitleRow
        projectId="kasparex-store"
        title="Available products"
        count={filteredAndSortedProducts.length}
        countLabel="product"
        countLoading={isLoading}
        loadingText="Loading products..."
        benefits={<StoreBuyerBenefitsPanel variant="compact" className="w-full" />}
      />

      <div className="flex flex-col gap-4 mb-8">
        <FilterBar
          search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search products...' }}
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        >
          <StoreListingFilters
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
            selectedCurrencies={selectedCurrencies}
            onCurrenciesChange={setSelectedCurrencies}
            currencyOptions={listedCurrencies}
          />
          <KxFilterDropdown
            value={selectedNetwork}
            onChange={setSelectedNetwork}
            options={[
              { value: 'all', label: 'Every Network' },
              { value: 'L1', label: 'L1 Only' },
              { value: 'L2', label: 'L2 Only' },
            ]}
            ariaLabel="Filter by network"
          />
          <KxTabStrip
            value={viewMode}
            onChange={setViewMode}
            options={[
              {
                value: 'grid',
                title: 'Grid view',
                ariaLabel: 'Grid view',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                ),
              },
              {
                value: 'compact',
                title: 'Compact view',
                ariaLabel: 'Compact view',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                ),
              },
            ]}
            ariaLabel="View mode"
            iconOnly
          />
          <ProductSortFilters sortBy={sortBy} onSortChange={setSortBy} />
        </FilterBar>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl h-[420px] animate-pulse" />
          ))}
        </div>
      ) : (
        <ProductGrid products={filteredAndSortedProducts} viewMode={viewMode} />
      )}
    </StorePageShell>
  );
}
