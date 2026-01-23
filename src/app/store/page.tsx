'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StoreSidebar } from '@/components/store/StoreSidebar';
import { ProductGrid } from '@/components/store/ProductGrid';
import { ProductSubmissionModal } from '@/components/store/ProductSubmissionModal';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getAllProducts } from '@/lib/store/products';
import { filterProducts } from '@/lib/store/filtering';
import { ProductSortFilters } from '@/components/store/ProductSortFilters';
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
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [selectedNetwork, setSelectedNetwork] = useState<ProductNetwork | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ProductViewMode>('grid');

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
    const filters = {
      category: selectedCategory,
      network: selectedNetwork,
      search: searchQuery,
    };
    
    let filtered = filterProducts(products, filters);
    filtered = sortProducts(filtered, sortBy);
    
    return filtered;
  }, [products, selectedCategory, selectedNetwork, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedNetwork('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="flex">
          {/* Sidebar */}
          <StoreSidebar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isWalletConnected={!!state.address}
            onSubmitProduct={() => setShowSubmitModal(true)}
          />

          {/* Main Content */}
          <div className="flex-1 lg:ml-0">
            <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:px-16 lg:py-12">
              {/* Header */}
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="lg:pl-0 pl-12 flex-1">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Kasparex Store
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {isLoading ? (
                      'Loading products...'
                    ) : (
                      `${filteredAndSortedProducts.length} product${filteredAndSortedProducts.length !== 1 ? 's' : ''} found`
                    )}
                  </p>
                </div>
                {/* Filters and Sort Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Filters (kept in main column for Kasparex consistency) */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'all')}
                    className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    aria-label="Filter by category"
                  >
                    <option value="all">All Categories</option>
                    <option value="Software">Software</option>
                    <option value="Art">Art</option>
                    <option value="Music">Music</option>
                    <option value="Templates">Templates</option>
                    <option value="Other">Other</option>
                  </select>
                  <select
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value as ProductNetwork | 'all')}
                    className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    aria-label="Filter by network"
                  >
                    <option value="all">All Networks</option>
                    <option value="L1">L1</option>
                    <option value="L2">L2</option>
                  </select>
                  {/* View Mode Controls */}
                  <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 text-sm font-medium transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                      title="Grid view"
                      aria-label="Grid view"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('compact')}
                      className={`p-2 text-sm font-medium transition-colors border-l border-zinc-200 dark:border-zinc-800 ${
                        viewMode === 'compact'
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                      title="Compact view"
                      aria-label="Compact view"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 text-sm font-medium transition-colors border-l border-zinc-200 dark:border-zinc-800 ${
                        viewMode === 'table'
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                      title="Table view"
                      aria-label="Table view"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <ProductSortFilters 
                    sortBy={sortBy} 
                    onSortChange={setSortBy}
                  />
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Products Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-zinc-100 dark:bg-zinc-900 rounded-lg h-80 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <ProductGrid products={filteredAndSortedProducts} viewMode={viewMode} />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Submit Product Modal */}
      <ProductSubmissionModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={async () => {
          // Reload products - the new registry CID is now in localStorage
          // Wait a moment for IPFS propagation, then reload
          await new Promise(resolve => setTimeout(resolve, 1000));
          await loadProducts();
        }}
      />
    </div>
  );
}
