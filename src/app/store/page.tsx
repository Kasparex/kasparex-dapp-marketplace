'use client';

import { useState, useEffect, useMemo } from 'react';
import { StoreHeader } from '@/components/store/StoreHeader';
import { StorePageShell } from '@/components/store/StorePageShell';
import { ProductGrid } from '@/components/store/ProductGrid';
import { getAllProducts } from '@/lib/store/products';
import { getCategoryCounts } from '@/lib/store/filtering';
import { ProductSortFilters } from '@/components/store/ProductSortFilters';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { FilterBar } from '@/components/FilterBar';
import { sortProducts, type SortOption } from '@/lib/store/sorting';
import type { ProductCategory, ProductNetwork } from '@/lib/store/types';

export type ProductViewMode = 'grid' | 'compact' | 'table';

export default function StorePage() {
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getAllProducts>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<ProductNetwork | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ProductViewMode>('grid');

  const categoryCounts = useMemo(() => getCategoryCounts(products), [products]);

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
    return () => { cancelled = true; };
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.category));
    }
    if (selectedNetwork !== 'all') {
      filtered = filtered.filter((p) => p.network === selectedNetwork);
    }
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower),
      );
    }
    return sortProducts(filtered, sortBy);
  }, [products, selectedCategories, selectedNetwork, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedNetwork('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <StorePageShell
      sidebar={{
        mode: 'listing',
        categories: ['Software', 'Art', 'Music', 'Templates', 'Other'],
        selectedCategories,
        onCategoryChange: setSelectedCategories,
        categoryCounts,
      }}
    >
      <StoreHeader />

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Available products</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {isLoading
            ? 'Loading products...'
            : `${filteredAndSortedProducts.length} product${filteredAndSortedProducts.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <FilterBar
          search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search products...' }}
          onReset={handleResetFilters}
        >
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
