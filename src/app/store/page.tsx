'use client';

import { useState, useEffect, useMemo } from 'react';
import { StoreHeader } from '@/components/store/StoreHeader';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { StoreSidebar } from '@/components/store/StoreSidebar';
import { ProductGrid } from '@/components/store/ProductGrid';
import { ProductSubmissionModal } from '@/components/store/ProductSubmissionModal';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getAllProducts } from '@/lib/store/products';
import { getCategoryCounts } from '@/lib/store/filtering';
import { ProductSortFilters } from '@/components/store/ProductSortFilters';
import { FilterBar } from '@/components/FilterBar';
import { sortProducts, type SortOption } from '@/lib/store/sorting';
import type { Product, ProductCategory, ProductNetwork } from '@/lib/store/types';

export type ProductViewMode = 'grid' | 'compact' | 'table';

export default function StorePage() {
  const { state } = useKaspaWallet();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<ProductNetwork | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ProductViewMode>('grid');

  // Category counts
  const categoryCounts = useMemo(() => getCategoryCounts(products), [products]);

  // Load products from IPFS
  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allProducts = await getAllProducts();
      setProducts(allProducts);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Category filter (multiple selection)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category));
    }

    // Network filter
    if (selectedNetwork !== 'all') {
      filtered = filtered.filter(p => p.network === selectedNetwork);
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower)
      );
    }

    filtered = sortProducts(filtered, sortBy);

    return filtered;
  }, [products, selectedCategories, selectedNetwork, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedNetwork('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="flex flex-1">
        <StoreSidebar
          mode="listing"
          categories={['Software', 'Art', 'Music', 'Templates', 'Other']}
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
          categoryCounts={categoryCounts}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto bg-white dark:bg-zinc-950 relative">
          <div className="max-w-7xl mx-auto">
            {/* Premium Header */}
            <StoreHeader />

            {/* Page Header - above Sorting area (dApps pattern) */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                Available products
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {isLoading ? (
                  'Loading products...'
                ) : (
                  `${filteredAndSortedProducts.length} product${filteredAndSortedProducts.length !== 1 ? 's' : ''} found`
                )}
              </p>
            </div>

            {/* Controls Area */}
            <div className="flex flex-col gap-4 mb-8">
              <FilterBar
                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search products...' }}
                onReset={handleResetFilters}
              >
                <select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value as ProductNetwork | 'all')}
                  className="k-filter-select"
                  aria-label="Filter by network"
                >
                  <option value="all">Every Network</option>
                  <option value="L1">L1 Only</option>
                  <option value="L2">L2 Only</option>
                </select>
                <div className="k-control-group">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 transition-colors ${viewMode === 'grid'
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8]'
                      : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    title="Grid view"
                    aria-label="Grid view"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                  <button
                    onClick={() => setViewMode('compact')}
                    className={`p-2.5 transition-colors border-l border-zinc-200 dark:border-zinc-800 ${viewMode === 'compact'
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8]'
                      : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    title="Compact view"
                    aria-label="Compact view"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  </button>
                </div>
                <ProductSortFilters sortBy={sortBy} onSortChange={setSortBy} />
              </FilterBar>
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl h-[400px] animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <ProductGrid products={filteredAndSortedProducts} viewMode={viewMode} />
            )}
          </div>
        </main>
      </div>

      <Footer />

      {/* Submit Product Modal */}
      <ProductSubmissionModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await loadProducts();
        }}
      />
    </div>
  );
}
