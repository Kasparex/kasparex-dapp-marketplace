'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getProductsBySeller, getProductById } from '@/lib/store/products';
import { getPurchasesBySeller, getPurchasesByBuyer } from '@/lib/store/purchases';
import { archiveProduct } from '@/lib/store/products';
import { StoreSidebar } from '@/components/store/StoreSidebar';
import { PurchasedItemsList } from '@/components/store/PurchasedItemsList';
import { getExplorerTxUrl, extractTxId } from '@/lib/store/utils';
import type { Product, Purchase } from '@/lib/store/types';

export default function SellerDashboardPage() {
  const { state } = useKaspaWallet();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [myPurchases, setMyPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sold' | 'purchased'>('sold');

  // Load seller data
  useEffect(() => {
    if (!state.address) {
      setIsLoading(false);
      return;
    }

    const currentAddress = state.address; // Capture address in a const for TypeScript

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);
      try {
        const sellerProducts = await getProductsBySeller(currentAddress);
        setProducts(sellerProducts);

        // Load purchases for seller's products
        const productIds = sellerProducts.map((p) => p.id);
        const sellerPurchases = await getPurchasesBySeller(currentAddress, productIds);
        setPurchases(sellerPurchases);

        // Load purchases made by this user
        const buyerPurchases = await getPurchasesByBuyer(currentAddress);
        setMyPurchases(buyerPurchases);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [state.address]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = purchases.reduce((sum, p) => sum + p.sellerRevenueKAS, 0);
    const totalSales = purchases.length;
    const recentSales = purchases
      .sort((a, b) => b.purchasedAt - a.purchasedAt)
      .slice(0, 10);

    return {
      totalRevenue,
      totalSales,
      recentSales,
    };
  }, [purchases]);

  const handleArchive = async (productId: string) => {
    if (!state.address) return;
    if (!confirm('Are you sure you want to archive this product?')) return;

    const success = await archiveProduct(productId, state.address);
    if (success) {
      // Reload products
      const updatedProducts = await getProductsBySeller(state.address);
      setProducts(updatedProducts);
    } else {
      alert('Failed to archive product');
    }
  };

  if (!state.isConnected || !state.address) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">🔌</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Connect Wallet
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Please connect your wallet to view your seller dashboard
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <div className="flex">
          {/* Sidebar */}
          <StoreSidebar
            searchQuery=""
            onSearchChange={() => { }}
            isWalletConnected={!!state.address}
            onSubmitProduct={() => { }}
            selectedCategories={[]}
            onCategoryChange={() => { }}
            categoryCounts={{
              Software: 0,
              Art: 0,
              Music: 0,
              Templates: 0,
              Other: 0,
            }}
            showCategories={false}
            backLink={{ href: '/store', label: 'Back to Store' }}
          />

          {/* Main Content */}
          <div className="flex-1 lg:ml-0">
            <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:px-16 lg:py-12">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Seller Dashboard
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Manage your products and track sales
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02abb8] mx-auto mb-4"></div>
                  <p className="text-zinc-600 dark:text-zinc-400">Loading dashboard...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                        Total Revenue
                      </h3>
                      <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                        {stats.totalRevenue.toFixed(4)} KAS
                      </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                        Total Sales
                      </h3>
                      <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                        {stats.totalSales}
                      </div>
                    </div>
                  </div>

                  {/* Content based on active tab */}
                  {activeTab === 'sold' ? (
                    <>
                      {/* Products List */}
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                          Your Products ({products.length})
                        </h2>
                        {products.length === 0 ? (
                          <p className="text-zinc-600 dark:text-zinc-400">
                            You have not listed any products yet.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {products.map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                              >
                                <div className="flex-1">
                                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {product.title}
                                  </h3>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                    <span>{product.priceKAS} KAS</span>
                                    <span>{product.purchaseCount} sales</span>
                                    <span className={`px-2 py-1 rounded text-xs ${product.status === 'active'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300'
                                      }`}>
                                      {product.status}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <a
                                    href={`/store/${product.slug}`}
                                    className="px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                                  >
                                    View
                                  </a>
                                  {product.status === 'active' && (
                                    <button
                                      onClick={() => handleArchive(product.id)}
                                      className="px-3 py-1 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                    >
                                      Archive
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Recent Sales */}
                      {stats.recentSales.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                            Recent Sales
                          </h2>
                          <div className="space-y-2">
                            {stats.recentSales.map((purchase) => {
                              const product = products.find((p) => p.id === purchase.productId);
                              return (
                                <div
                                  key={purchase.id}
                                  className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                                >
                                  <div>
                                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                      {product?.title || 'Unknown Product'}
                                    </div>
                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                      {new Date(purchase.purchasedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                      {purchase.sellerRevenueKAS.toFixed(4)} KAS
                                    </div>
                                    <a
                                      href={getExplorerTxUrl(purchase.txHash)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm font-medium text-[#02abb8] hover:underline flex items-center gap-1"
                                    >
                                      View Transaction
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <PurchasedItemsList purchases={myPurchases} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
