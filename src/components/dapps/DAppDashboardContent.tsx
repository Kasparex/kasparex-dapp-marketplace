'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { DAppPageShell } from '@/components/dapps/DAppPageShell';
import { StoreWalletBanner } from '@/components/store/StoreWalletBanner';
import { DAppListingForm } from '@/components/dapps/DAppListingForm';
import { DAPPS_DASHBOARD_GATE } from '@/lib/hub/gateConfigs';
import {
  parseDAppDashboardTab,
  dAppDashboardTabHref,
  type DAppDashboardTab,
} from '@/lib/dapps/dashboardTabs';
import {
  DAPP_LISTING_FEE_KAS,
  getDAppListingSubmissions,
  type DAppListingSubmission,
} from '@/lib/dapps/listingSubmissions';
import { getCategoryById, categories, type Category } from '@/lib/categories';
import { getExplorerTxUrl } from '@/lib/store/utils';

const TAB_LABELS: Record<DAppDashboardTab, string> = {
  overview: 'Overview',
  listings: 'My Listings',
  create: 'List a DApp',
};

const LISTING_CATEGORIES = categories.filter((c) => c.id !== 'all');

function ListingRow({ item }: { item: DAppListingSubmission }) {
  const cat = getCategoryById(item.category);
  return (
    <div className="p-4 flex items-start gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 flex items-center justify-center flex-shrink-0 font-black text-lg">
        {cat?.emoji ?? '⚡'}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mt-1">
          {cat ? <span>{cat.name}</span> : null}
          <span>•</span>
          <span>
            {item.feeAmountKAS} KAS fee ({item.paymentCurrency})
          </span>
          <span>•</span>
          <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
        </div>
        <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{item.description}</p>
        {item.websiteUrl ? (
          <a
            href={item.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#02abb8] hover:underline mt-1 inline-block"
          >
            {item.websiteUrl}
          </a>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="rounded px-2 py-1 text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-800 dark:text-cyan-300">
          {item.status}
        </span>
        {item.feeTxHash ? (
          <a
            href={getExplorerTxUrl(item.feeTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-zinc-400 hover:text-[#02abb8] hover:underline"
          >
            View tx
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function DAppDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useKaspaWallet();

  const [activeTab, setActiveTab] = useState<DAppDashboardTab>('overview');
  const [listings, setListings] = useState<DAppListingSubmission[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActiveTab(parseDAppDashboardTab(searchParams.get('tab')));
  }, [searchParams]);

  const goTab = useCallback(
    (tab: DAppDashboardTab) => {
      setActiveTab(tab);
      router.replace(dAppDashboardTabHref(tab));
    },
    [router],
  );

  const refreshListings = useCallback(() => {
    if (!state.address) {
      setListings([]);
      setIsLoading(false);
      return;
    }
    setListings(getDAppListingSubmissions(state.address));
    setIsLoading(false);
  }, [state.address]);

  useEffect(() => {
    setIsLoading(true);
    refreshListings();
    const onUpdate = () => refreshListings();
    window.addEventListener('dapp-listing-submissions-updated', onUpdate);
    return () => window.removeEventListener('dapp-listing-submissions-updated', onUpdate);
  }, [refreshListings]);

  const filteredListings = useMemo(() => {
    if (categoryFilter === 'all') return listings;
    return listings.filter((s) => s.category === categoryFilter);
  }, [categoryFilter, listings]);

  const stats = useMemo(() => {
    const byCategory = LISTING_CATEGORIES.reduce(
      (acc, cat) => {
        acc[cat.id] = listings.filter((l) => l.category === cat.id).length;
        return acc;
      },
      {} as Record<string, number>,
    );
    return { totalListings: listings.length, byCategory };
  }, [listings]);

  return (
    <DAppPageShell
      sidebar={{
        dashboardTab: activeTab,
        onDashboardTabChange: goTab,
        totalListings: stats.totalListings,
      }}
    >
      <div className="mb-10">
        <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">dApp dashboard</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
          dApps <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-500">Center</span>
        </h1>
        {state.address ? <p className="text-sm text-zinc-500 font-mono">{state.address}</p> : null}
      </div>

      <StoreWalletBanner config={DAPPS_DASHBOARD_GATE} />

      <div className="flex items-center gap-1 p-1 k-control-group w-fit mb-8 flex-wrap">
        {(Object.keys(TAB_LABELS) as DAppDashboardTab[]).map((tab) => (
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

      {activeTab === 'create' ? (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
          {state.isConnected ? (
            <DAppListingForm onSubmitted={refreshListings} />
          ) : (
            <p className="text-center text-zinc-500 py-12">Connect your Kaspa wallet to list a dApp.</p>
          )}
        </div>
      ) : !state.isConnected ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            Connect your Kaspa wallet to view directory listings and submit promotional dApps.
          </p>
        </div>
      ) : isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
        </div>
      ) : (
        <div className="space-y-8">
          {(activeTab === 'overview' || activeTab === 'listings') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 group hover:border-cyan-500/30 transition-colors">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Directory listings</h3>
                <div className="text-4xl font-black text-zinc-900 dark:text-white">
                  {stats.totalListings}{' '}
                  <span className="text-lg text-zinc-500">submitted</span>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 group hover:border-cyan-500/30 transition-colors">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Listing fee</h3>
                <div className="text-4xl font-black text-zinc-900 dark:text-white">
                  {DAPP_LISTING_FEE_KAS}{' '}
                  <span className="text-lg text-zinc-500">KAS / KREX</span>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'listings' || activeTab === 'overview') && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                  Your directory listings
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  {activeTab === 'overview' ? (
                    <button
                      type="button"
                      onClick={() => goTab('listings')}
                      className="text-xs font-bold text-[#02abb8] hover:underline uppercase tracking-wider"
                    >
                      View all
                    </button>
                  ) : (
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs"
                    >
                      <option value="all">All categories</option>
                      {LISTING_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.emoji} {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => goTab('create')}
                    className="k-control-btn !border-cyan-500/30 !bg-cyan-500/10 !text-cyan-800 dark:!text-cyan-300 text-xs"
                  >
                    List a DApp
                  </button>
                </div>
              </div>

              {(activeTab === 'overview' ? listings.slice(0, 5) : filteredListings).length === 0 ? (
                <div className="p-12 text-center text-zinc-500">
                  <p>You haven&apos;t submitted any directory listings yet.</p>
                  <button
                    type="button"
                    onClick={() => goTab('create')}
                    className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:from-cyan-700 hover:to-teal-700 transition-colors"
                  >
                    Submit first listing
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {(activeTab === 'overview' ? listings.slice(0, 5) : filteredListings).map((item) => (
                    <ListingRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'overview' && stats.totalListings > 0 && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide mb-4">
                By category
              </h2>
              <div className="flex flex-wrap gap-2">
                {LISTING_CATEGORIES.filter((c) => stats.byCategory[c.id] > 0).map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                  >
                    {c.emoji} {c.name}
                    <span className="font-bold text-[#02abb8]">{stats.byCategory[c.id]}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DAppPageShell>
  );
}
