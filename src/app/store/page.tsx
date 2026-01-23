'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StoreSidebar } from '@/components/store/StoreSidebar';
import { ProductCard } from '@/components/store/ProductCard';
import { ProductSubmissionModal } from '@/components/store/ProductSubmissionModal';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getAllProducts } from '@/lib/store/products';
import { filterProducts, getAvailableCategories } from '@/lib/store/filtering';
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

  // Get available categories
  const availableCategories = useMemo(() => getAvailableCategories(products), [products]);

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
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedNetwork={selectedNetwork}
            onNetworkChange={setSelectedNetwork}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            availableCategories={availableCategories}
            onResetFilters={handleResetFilters}
          />

          {/* Main Content */}
          <div className="flex-1 lg:ml-0">
            <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:px-16 lg:py-12">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Kasparex Store
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Digital products marketplace powered by KAS
                </p>
              </div>

              {/* Controls Bar */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {isLoading ? (
                    'Loading products...'
                  ) : (
                    `${filteredAndSortedProducts.length} product${filteredAndSortedProducts.length !== 1 ? 's' : ''} found`
                  )}
                </div>
                
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-zinc-600 dark:text-zinc-400">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="popular">Most Popular</option>
                  </select>
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
