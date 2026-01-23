'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StoreSidebar } from '@/components/store/StoreSidebar';
import { ProductCard } from '@/components/store/ProductCard';
import { ProductSubmissionModal } from '@/components/store/ProductSubmissionModal';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getAllProducts } from '@/lib/store/products';
import { filterProducts } from '@/lib/store/filtering';
import { ProductSortFilters } from '@/components/store/ProductSortFilters';
import Link from 'next/link';
import { sortProducts, type SortOption } from '@/lib/store/sorting';
import type { Product, ProductCategory, ProductNetwork } from '@/lib/store/types';

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

  // Load products from IPFS
  useEffect(() => {
    async function loadProducts() {
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
    }

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
                {/* Action Buttons and Sort Filters */}
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
                  {state.address && (
                    <>
                      <button
                        onClick={() => setShowSubmitModal(true)}
                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap"
                      >
                        Submit Product
                      </button>
                      <Link
                        href="/store/dashboard"
                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap"
                      >
                        Dashboard
                      </Link>
                    </>
                  )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-zinc-100 dark:bg-zinc-900 rounded-lg h-80 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    No products found. Try adjusting your filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAndSortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
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
        onSuccess={() => {
          // Reload products
          getAllProducts().then(setProducts);
        }}
      />
    </div>
  );
}
