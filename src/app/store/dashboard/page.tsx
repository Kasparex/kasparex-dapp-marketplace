'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getProductsBySeller } from '@/lib/store/products';
import { getPurchasesBySeller, getPurchasesByBuyer } from '@/lib/store/purchases';
import { archiveProduct } from '@/lib/store/products';
import { StoreSidebar } from '@/components/store/StoreSidebar';
import { PurchasedItemsList } from '@/components/store/PurchasedItemsList';
import { getExplorerTxUrl } from '@/lib/store/utils';
import type { Product, Purchase } from '@/lib/store/types';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function DashboardContent() {
  const { state } = useKaspaWallet();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [myPurchases, setMyPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'sales' | 'purchased'>('overview');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'purchased') setActiveTab('purchased');
    else if (tab === 'products') setActiveTab('products');
    else if (tab === 'sales') setActiveTab('sales');
    else setActiveTab('overview');
  }, [searchParams]);

  // Load seller data
  useEffect(() => {
    if (!state.address) {
      setIsLoading(false);
      return;
    }

    const currentAddress = state.address;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);
      try {
        const sellerProducts = await getProductsBySeller(currentAddress);
        setProducts(sellerProducts);

        const productIds = sellerProducts.map((p) => p.id);
        const sellerPurchases = await getPurchasesBySeller(currentAddress, productIds);
        setPurchases(sellerPurchases);

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
        <main className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="text-center p-8 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-md w-full">
            <div className="text-4xl mb-6">🔌</div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-2 uppercase tracking-wide">
              Wallet Required
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 font-medium">
              Please connect your Kaspa wallet to access the seller dashboard.
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

      <div className="flex flex-1">
        {/* Sidebar */}
        <StoreSidebar
          mode="dashboard"
          sellerRevenue={stats.totalRevenue}
          totalSales={stats.totalSales}
        />

        {/* Main Content */}
        <div className="flex-1 w-full p-4 sm:p-6 lg:p-12 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
                Store <span className="text-[#02abb8]">Dashboard</span>
              </h1>
              <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {state.address}
              </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit mb-12 border border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
              >
                My Purchases
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'products'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
              >
                Seller Center
              </button>
              <button
                onClick={() => setActiveTab('sales')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'sales'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
              >
                Sales & Revenue
              </button>
            </div>

            {/* Rewards Status Card */}
            <div className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-3xl p-8 mb-12 border border-zinc-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#02abb8]/10 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-black">My Rewards & Benefits</h2>
                  </div>
                  <p className="text-zinc-400 text-sm max-w-md">
                    Your KREX holdings and NFT ownership unlock exclusive discounts and perks across the Kasparex Store platform.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-8">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Listing Fee Discount</div>
                    <div className="text-2xl font-black text-emerald-400">5% OFF</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Assets</div>
                    <div className="text-2xl font-black text-[#02abb8]">NFT Enabled</div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm font-bold text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02abb8]"></div>
              </div>
            ) : (
              <div className="space-y-8">

                {/* Stats Overview */}
                {(activeTab === 'overview') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-violet-500/30 transition-colors">
                      <div className="relative z-10">
                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                          Total Revenue
                        </h3>
                        <div className="text-4xl font-black text-zinc-900 dark:text-white">
                          {stats.totalRevenue.toFixed(4)} <span className="text-lg text-zinc-500">KAS</span>
                        </div>
                      </div>
                      <div className="absolute right-0 bottom-0 p-4 opacity-10 text-violet-500 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" /></svg>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-violet-500/30 transition-colors">
                      <div className="relative z-10">
                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                          Total Sales
                        </h3>
                        <div className="text-4xl font-black text-zinc-900 dark:text-white">
                          {stats.totalSales} <span className="text-lg text-zinc-500">Items</span>
                        </div>
                      </div>
                      <div className="absolute right-0 bottom-0 p-4 opacity-10 text-violet-500 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products Tab */}
                {(activeTab === 'products' || activeTab === 'overview') && (
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                      <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                        Your Products
                      </h2>
                      {activeTab === 'overview' && (
                        <Link href="/store/dashboard?tab=products" className="text-xs font-bold text-violet-500 hover:underline uppercase tracking-wider">View All</Link>
                      )}
                    </div>

                    {products.length === 0 ? (
                      <div className="p-12 text-center text-zinc-500">
                        <p>You haven&apos;t listed any products yet.</p>
                        <button className="mt-4 px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-violet-600 transition-colors">
                          Create First Product
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {products.slice(0, activeTab === 'overview' ? 5 : undefined).map((product) => (
                          <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                            <div className="w-12 h-12 rounded bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden">
                              {product.thumbnailCid && (
                                <img src={`https://gateway.pinata.cloud/ipfs/${product.thumbnailCid}`} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{product.title}</h3>
                              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                <span>{product.priceKAS} KAS</span>
                                <span>•</span>
                                <span>{product.purchaseCount} Sales</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${product.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-500'
                                  }`}>{product.status}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link href={`/store/${product.slug}`} className="p-2 text-zinc-400 hover:text-violet-500 transition-colors" title="View">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </Link>
                              {product.status === 'active' && (
                                <button onClick={() => handleArchive(product.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors" title="Archive">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sales Tab */}
                {(activeTab === 'sales' || activeTab === 'overview') && stats.recentSales.length > 0 && (
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                      <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                        Recent Sales
                      </h2>
                      {activeTab === 'overview' && (
                        <Link href="/store/dashboard?tab=sales" className="text-xs font-bold text-violet-500 hover:underline uppercase tracking-wider">View All</Link>
                      )}
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {stats.recentSales.slice(0, activeTab === 'overview' ? 5 : undefined).map((purchase) => {
                        const product = products.find((p) => p.id === purchase.productId);
                        return (
                          <div key={purchase.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-zinc-100">{product?.title || 'Unknown Product'}</div>
                              <div className="text-xs text-zinc-500 mt-1">{new Date(purchase.purchasedAt).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-violet-500">+{purchase.sellerRevenueKAS.toFixed(4)} KAS</div>
                              <a href={getExplorerTxUrl(purchase.txHash)} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-violet-500 hover:underline">
                                View Tx
                              </a>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Purchased Tab */}
                {(activeTab === 'purchased') && (
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                      <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                        My Purchased Items
                      </h2>
                    </div>
                    <PurchasedItemsList purchases={myPurchases} />
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SellerDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
        </main>
        <Footer />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
