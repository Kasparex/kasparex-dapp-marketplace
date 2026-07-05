'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getProductsBySeller, archiveProductLocal } from '@/lib/store/products';
import { getPurchasesBySeller, getPurchasesByBuyer } from '@/lib/store/purchases';
import { StorePageShell } from '@/components/store/StorePageShell';
import { PurchasedItemsList } from '@/components/store/PurchasedItemsList';
import { StoreWalletBanner } from '@/components/store/StoreWalletBanner';
import { StoreProductForm } from '@/components/store/StoreProductForm';
import { SELLER_ACTION_FEE_KAS } from '@/components/store/StoreProductForm';
import { getExplorerTxUrl } from '@/lib/store/utils';
import { getProductPaymentCurrency } from '@/lib/store/currencies';
import { parseStoreSellerTab, storeSellerTabHref, type StoreSellerTab } from '@/lib/store/sellerTabs';
import type { Product, Purchase } from '@/lib/store/types';
import { STORE_DASHBOARD_GATE } from '@/lib/hub/gateConfigs';
import { MobileDesktopOnlyGate } from '@/components/hub/MobileDesktopOnlyGate';
import { executeHubPaidDelete, HUB_DELETE_FEE_KAS } from '@/lib/hub/paidDelete';
import { collectStoreMediaCids } from '@/lib/ipfs/cidUtils';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

const TAB_LABELS: Record<StoreSellerTab, string> = {
  overview: 'Overview',
  purchased: 'My Purchases',
  products: 'My Products',
  sales: 'Sales',
  create: 'List Product',
};

export function StoreSellerHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useKaspaWallet();

  const [activeTab, setActiveTab] = useState<StoreSellerTab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [myPurchases, setMyPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionProductId, setActionProductId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(parseStoreSellerTab(searchParams.get('tab')));
  }, [searchParams]);

  const goTab = useCallback(
    (tab: StoreSellerTab) => {
      setActiveTab(tab);
      router.replace(storeSellerTabHref(tab));
    },
    [router],
  );

  useEffect(() => {
    if (!state.address) {
      setProducts([]);
      setPurchases([]);
      setMyPurchases([]);
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

  const stats = useMemo(() => {
    const totalRevenue = purchases.reduce((sum, p) => sum + p.sellerRevenueKAS, 0);
    const totalSales = purchases.length;
    const recentSales = purchases.sort((a, b) => b.purchasedAt - a.purchasedAt).slice(0, 10);
    return { totalRevenue, totalSales, recentSales };
  }, [purchases]);

  const handleDelete = async (productId: string) => {
    if (!state.address || !state.provider) {
      alert('Connect your Kaspa wallet to delete this product.');
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const deleteFee = HUB_DELETE_FEE_KAS.store;
    if (!confirm(`Archive "${product.title}"? A ${deleteFee} KAS fee applies.`)) return;

    setActionProductId(productId);
    try {
      const result = await executeHubPaidDelete({
        kind: 'store',
        id: productId,
        feeKas: deleteFee,
        payerProvider: state.provider as KaspaWalletProvider,
        payerAddress: state.address,
        mediaCids: collectStoreMediaCids(product),
        removeLocal: async () => {
          const archived = await archiveProductLocal(productId, state.address!);
          return archived.ok;
        },
      });
      if (!result.ok) throw new Error(result.error ?? 'Delete failed');
      const updatedProducts = await getProductsBySeller(state.address);
      setProducts(updatedProducts);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to archive product');
    } finally {
      setActionProductId(null);
    }
  };

  const showSellerStats = activeTab === 'overview' || activeTab === 'products' || activeTab === 'sales';

  return (
    <StorePageShell
      sidebar={{
        mode: 'dashboard',
        sellerRevenue: stats.totalRevenue,
        totalSales: stats.totalSales,
        sellerTab: activeTab,
        onSellerTabChange: goTab,
      }}
    >
      <MobileDesktopOnlyGate title="Store Seller Hub" backHref="/store" backLabel="Back to Store">
      <div className="mb-10">
        <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Seller dashboard</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
          Store <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-500">Center</span>
        </h1>
        {state.address ? <p className="text-sm text-zinc-500 font-mono">{state.address}</p> : null}
      </div>

      <StoreWalletBanner config={STORE_DASHBOARD_GATE} />

      <div className="flex items-center gap-1 p-1 k-control-group w-fit mb-8 flex-wrap">
        {(Object.keys(TAB_LABELS) as StoreSellerTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => goTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab
                ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8] shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm font-bold text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {activeTab === 'create' ? (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
          {state.isConnected ? (
            <StoreProductForm />
          ) : (
            <p className="text-center text-zinc-500 py-12">Connect your Kaspa wallet to list a product.</p>
          )}
        </div>
      ) : !state.isConnected ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">Connect your Kaspa wallet to view seller stats and manage products.</p>
        </div>
      ) : isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
        </div>
      ) : (
        <div className="space-y-8">
          {showSellerStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 group hover:border-cyan-500/30 transition-colors">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Total Revenue</h3>
                <div className="text-4xl font-black text-zinc-900 dark:text-white">
                  {stats.totalRevenue.toFixed(4)} <span className="text-lg text-zinc-500">KAS</span>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 group hover:border-cyan-500/30 transition-colors">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Total Sales</h3>
                <div className="text-4xl font-black text-zinc-900 dark:text-white">
                  {stats.totalSales} <span className="text-lg text-zinc-500">Items</span>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'products' || activeTab === 'overview') && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4">
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Your Products</h2>
                <div className="flex items-center gap-3">
                  {activeTab === 'overview' && (
                    <button
                      type="button"
                      onClick={() => goTab('products')}
                      className="text-xs font-bold text-[#02abb8] hover:underline uppercase tracking-wider"
                    >
                      View all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => goTab('create')}
                    className="k-control-btn !border-cyan-500/30 !bg-cyan-500/10 !text-cyan-800 dark:!text-cyan-300 text-xs"
                  >
                    Add new
                  </button>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">
                  <p>You haven&apos;t listed any products yet.</p>
                  <button
                    type="button"
                    onClick={() => goTab('create')}
                    className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:from-cyan-700 hover:to-teal-700 transition-colors"
                  >
                    Create first product
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {products.slice(0, activeTab === 'overview' ? 5 : undefined).map((product) => {
                    const cur = getProductPaymentCurrency(product);
                    return (
                      <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <div className="w-12 h-12 rounded bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden">
                          {product.thumbnailCid && (
                            <img src={`https://gateway.pinata.cloud/ipfs/${product.thumbnailCid}`} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{product.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                            <span>
                              {product.priceKAS} {cur}
                            </span>
                            <span>•</span>
                            <span>{product.purchaseCount} sales</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                product.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-zinc-100 text-zinc-500'
                              }`}
                            >
                              {product.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/store/${product.slug}`} className="p-2 text-zinc-400 hover:text-[#02abb8] transition-colors" title="View">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          {product.status === 'active' && (
                            <>
                              <Link
                                href={`/store/edit/${product.slug}`}
                                className="p-2 text-zinc-400 hover:text-[#02abb8] transition-colors"
                                title={`Edit (${SELLER_ACTION_FEE_KAS} KAS)`}
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                              <button
                                type="button"
                                onClick={() => void handleDelete(product.id)}
                                disabled={actionProductId === product.id}
                                className="p-2 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                title={`Archive (${HUB_DELETE_FEE_KAS.store} KAS)`}
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {(activeTab === 'sales' || activeTab === 'overview') && stats.recentSales.length > 0 && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Recent Sales</h2>
                {activeTab === 'overview' && (
                  <button
                    type="button"
                    onClick={() => goTab('sales')}
                    className="text-xs font-bold text-[#02abb8] hover:underline uppercase tracking-wider"
                  >
                    View all
                  </button>
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
                        <div className="font-black text-emerald-600 dark:text-emerald-400">+{purchase.sellerRevenueKAS.toFixed(4)} KAS</div>
                        <a href={getExplorerTxUrl(purchase.txHash)} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-[#02abb8] hover:underline">
                          View tx
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'purchased' && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">My Purchased Items</h2>
              </div>
              <PurchasedItemsList purchases={myPurchases} />
            </div>
          )}
        </div>
      )}
      </MobileDesktopOnlyGate>
    </StorePageShell>
  );
}
