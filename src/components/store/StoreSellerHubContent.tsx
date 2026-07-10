'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getProductsBySeller, archiveProductLocal } from '@/lib/store/products';
import { getPurchasesByBuyer } from '@/lib/store/purchases';
import { StorePageShell } from '@/components/store/StorePageShell';
import { StorePurchasedGrid } from '@/components/store/StorePurchasedGrid';
import { StoreSellerProductList } from '@/components/store/StoreSellerProductList';
import { StoreWalletBanner } from '@/components/store/StoreWalletBanner';
import { StoreProductForm } from '@/components/store/StoreProductForm';
import { parseStoreSellerTab, storeSellerTabHref, type StoreSellerTab } from '@/lib/store/sellerTabs';
import type { Product, Purchase } from '@/lib/store/types';
import { STORE_DASHBOARD_GATE } from '@/lib/hub/gateConfigs';
import { MobileDesktopOnlyGate } from '@/components/hub/MobileDesktopOnlyGate';
import { useKxSystemDialog } from '@/hooks/useKxSystemDialog';
import { executeHubPaidDelete, HUB_DELETE_FEE_KAS } from '@/lib/hub/paidDelete';
import { collectStoreMediaCids } from '@/lib/ipfs/cidUtils';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';

const TAB_LABELS: Record<StoreSellerTab, string> = {
  purchased: 'My Purchases',
  products: 'My Products',
  create: 'List Product',
};

export function StoreSellerHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useKaspaWallet();
  const { confirm, alert } = useKxSystemDialog();

  const [activeTab, setActiveTab] = useState<StoreSellerTab>('products');
  const [products, setProducts] = useState<Product[]>([]);
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

  const handleDelete = async (productId: string) => {
    if (!state.address || !state.provider) {
      await alert({
        title: 'Wallet required',
        message: 'Connect your Kaspa wallet to archive this product.',
      });
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const deleteFee = HUB_DELETE_FEE_KAS.store;
    const ok = await confirm({
      title: 'Archive product',
      message: `Archive "${product.title}"? A ${deleteFee} KAS fee applies.`,
      confirmLabel: 'Archive',
      destructive: true,
    });
    if (!ok) return;

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
      await alert({
        title: 'Archive failed',
        message: err instanceof Error ? err.message : 'Failed to archive product',
      });
    } finally {
      setActionProductId(null);
    }
  };

  return (
    <StorePageShell
      sidebar={{
        mode: 'dashboard',
        sellerTab: activeTab,
        onSellerTabChange: goTab,
      }}
    >
      <MobileDesktopOnlyGate title="Store Seller Hub" backHref="/store" backLabel="Back to Store">
        <div className="mb-8">
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-[#02abb8]">
            Seller dashboard
          </p>
          <div className="flex items-center gap-3 mb-2">
            <span
              className="h-7 w-1.5 shrink-0 rounded-full bg-[#02abb8] shadow-[0_0_10px_rgba(2,171,184,0.35)]"
              aria-hidden="true"
            />
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight tracking-tight">
              Store <span className="text-[#02abb8]">Center</span>
            </h1>
          </div>
          <p className="kx-body max-w-3xl">
            List digital products, track sales, and manage your Store listings.
          </p>
        </div>

        <StoreWalletBanner config={STORE_DASHBOARD_GATE} />

        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800 mb-8 flex-wrap">
          {(Object.keys(TAB_LABELS) as StoreSellerTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => goTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-zinc-800 text-[#02abb8] dark:text-[#66dfe8] shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {tab === 'purchased'
                ? `${TAB_LABELS[tab]} (${myPurchases.length})`
                : tab === 'products'
                  ? `${TAB_LABELS[tab]} (${products.length})`
                  : TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm font-bold text-red-800 dark:text-red-300">{error}</p>
          </div>
        ) : null}

        <div className="min-h-[400px]">
          {activeTab === 'create' ? (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              {state.isConnected ? (
                <StoreProductForm />
              ) : (
                <p className="text-center text-zinc-500 py-12">Connect your Kaspa wallet to list a product.</p>
              )}
            </div>
          ) : !state.isConnected ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-12 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                Connect your Kaspa wallet to view your purchases and products.
              </p>
            </div>
          ) : isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              {activeTab === 'products' ? (
                <>
                  <HubListingTitleRow
                    projectId="kasparex-store"
                    title="My products"
                    count={products.length}
                    countLabel="listing"
                  />
                  <StoreSellerProductList
                    products={products}
                    onArchive={(id) => void handleDelete(id)}
                    actionProductId={actionProductId}
                    onListProduct={() => goTab('create')}
                  />
                </>
              ) : null}

              {activeTab === 'purchased' ? (
                <>
                  <HubListingTitleRow
                    projectId="kasparex-store"
                    title="My purchases"
                    count={myPurchases.length}
                    countLabel="purchase"
                  />
                  <StorePurchasedGrid purchases={myPurchases} />
                </>
              ) : null}
            </div>
          )}
        </div>
      </MobileDesktopOnlyGate>
    </StorePageShell>
  );
}
