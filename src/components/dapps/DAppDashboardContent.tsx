'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  KX_DASHBOARD_TAB_SHELL,
  KX_DASHBOARD_TAB_BTN,
  KX_DASHBOARD_TAB_BTN_ACTIVE,
} from '@/lib/hub/shellTokens';
import { HubDashboardPageHeader } from '@/components/hub/HubDashboardPageHeader';
import { VBlogFeeCard } from '@/components/vblog/VBlogPricingCards';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import {
  DAPP_LISTING_ACTION_FEE_KAS,
  DAPP_LISTING_FEE_KAS,
  archiveDirectoryListingLocal,
  calculateDirectoryListingFeeKas,
  getDirectoryListingById,
  listingActionFeeLabel,
  type DirectoryListing,
} from '@/lib/dapps/listingSubmissions';
import { useDirectoryListings } from '@/hooks/useDirectoryListings';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { getCategoryById, categories, type Category } from '@/lib/categories';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { getExplorerTxUrl } from '@/lib/store/utils';
import { getBestGatewayUrl } from '@/lib/hub/ipfsStandard';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { executeHubPaidDelete, HUB_DELETE_FEE_KAS } from '@/lib/hub/paidDelete';
import { useKxSystemDialog } from '@/hooks/useKxSystemDialog';
import { collectDappMediaCids } from '@/lib/ipfs/cidUtils';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

const TAB_LABELS: Record<DAppDashboardTab, string> = {
  overview: 'Overview',
  listings: 'My Listings',
  create: 'List a DApp',
};

const LISTING_CATEGORIES = categories.filter((c) => c.id !== 'all');

function ListingRow({
  item,
  onEdit,
  onDelete,
  isDeleting,
}: {
  item: DirectoryListing;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const cat = getCategoryById(item.category);
  const thumb = item.logoUrl
    ? item.logoUrl
    : item.logoCid
      ? getBestGatewayUrl(item.logoCid)
      : item.featureImageUrl
        ? item.featureImageUrl
        : item.featureImageCid
          ? getBestGatewayUrl(item.featureImageCid)
          : null;

  return (
    <div className="p-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 flex items-center justify-center flex-shrink-0 font-black text-lg">
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          (cat?.emoji ?? '⚡')
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</h3>
          {item.status === 'archived' ? (
            <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              archived
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mt-1">
          {cat ? <span>{cat.name}</span> : null}
          <span>•</span>
          <span>
            {item.feeAmountKAS} KAS fee ({item.paymentCurrency})
          </span>
          <span>•</span>
          <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
        </div>
        <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{item.shortDescription}</p>
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
      <div className="flex items-center gap-1 shrink-0">
        {item.status === 'active' ? (
          <Link
            href={`/dapps/${item.slug}`}
            className="p-2 text-zinc-400 hover:text-[#02abb8] transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="View page"
            aria-label="View page"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
        ) : null}
        {item.feeTxHash ? (
          <a
            href={getExplorerTxUrl(item.feeTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-400 hover:text-[#02abb8] transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="View transaction"
            aria-label="View transaction"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : null}
        {item.status === 'active' ? (
          <>
            <button
              type="button"
              onClick={() => onEdit(item.id)}
              className="p-2 text-zinc-400 hover:text-[#02abb8] transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title={`Edit (${DAPP_LISTING_ACTION_FEE_KAS} KAS)`}
              aria-label="Edit listing"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => onDelete(item.id)}
              className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
              title={`Delete (${HUB_DELETE_FEE_KAS.dapps} KAS)`}
              aria-label="Delete listing"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function DAppDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useKaspaWallet();
  const { listings, refresh } = useDirectoryListings(state.address ?? undefined);
  const { tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { confirm } = useKxSystemDialog();

  const [activeTab, setActiveTab] = useState<DAppDashboardTab>('overview');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(parseDAppDashboardTab(searchParams.get('tab')));
    setEditId(searchParams.get('edit'));
  }, [searchParams]);

  const goTab = useCallback(
    (tab: DAppDashboardTab, edit?: string | null) => {
      setActiveTab(tab);
      if (tab === 'create' && edit) {
        router.replace(`/dapps/dashboard?tab=create&edit=${edit}`);
        setEditId(edit);
        return;
      }
      router.replace(dAppDashboardTabHref(tab));
      setEditId(null);
    },
    [router],
  );

  const editListing = useMemo(
    () => (editId ? getDirectoryListingById(editId) : undefined),
    [editId, listings],
  );

  const filteredListings = useMemo(() => {
    const active = listings.filter((s) => s.status === 'active');
    if (categoryFilter === 'all') return active;
    return active.filter((s) => s.category === categoryFilter);
  }, [categoryFilter, listings]);

  const stats = useMemo(() => {
    const active = listings.filter((l) => l.status === 'active');
    const byCategory = LISTING_CATEGORIES.reduce(
      (acc, cat) => {
        acc[cat.id] = active.filter((l) => l.category === cat.id).length;
        return acc;
      },
      {} as Record<string, number>,
    );
    return { totalListings: active.length, byCategory };
  }, [listings]);

  const handleEdit = (id: string) => goTab('create', id);

  const handleDelete = async (id: string) => {
    if (!state.address || !state.provider) {
      setActionError('Connect your Kaspa wallet to delete a listing.');
      return;
    }
    const listing = getDirectoryListingById(id);
    if (!listing) return;

    const deleteFeeKas = calculateDirectoryListingFeeKas(
      HUB_DELETE_FEE_KAS.dapps,
      krexTier,
      nftStatus,
    ).effectiveKas;
    const feeLabel = listingActionFeeLabel(listing.paymentCurrency, deleteFeeKas);
    const ok = await confirm({
      title: 'Remove listing',
      message: `Remove "${listing.name}" from the public directory? A ${feeLabel} fee applies.`,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;

    setDeletingId(id);
    setActionError(null);
    try {
      const result = await executeHubPaidDelete({
        kind: 'dapps',
        id,
        feeKas: deleteFeeKas,
        payerProvider: state.provider as KaspaWalletProvider,
        payerAddress: state.address,
        mediaCids: collectDappMediaCids(listing),
        removeLocal: () => archiveDirectoryListingLocal(id, state.address!),
      });
      if (!result.ok) throw new Error(result.error ?? 'Failed to remove listing');
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove listing');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DAppPageShell
      sidebar={{
        dashboardTab: activeTab,
        onDashboardTabChange: (tab) => goTab(tab),
        totalListings: stats.totalListings,
      }}
    >
      <HubDashboardPageHeader
        kicker="dApp dashboard"
        title="dApps"
        titleAccent="Center"
        excerpt="List your dApp in the Kasparex directory with modular pricing, KREX discounts, and Hub Points."
        meta={
          state.address ? <p className="font-mono text-sm text-zinc-500">{state.address}</p> : null
        }
      />

      <StoreWalletBanner config={DAPPS_DASHBOARD_GATE} />

      <div className={`${KX_DASHBOARD_TAB_SHELL} mb-8 flex-wrap`}>
        {(Object.keys(TAB_LABELS) as DAppDashboardTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => goTab(tab)}
            className={`${KX_DASHBOARD_TAB_BTN} ${activeTab === tab ? KX_DASHBOARD_TAB_BTN_ACTIVE : ''}`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeTab === 'create' ? (
        <div id="dapps-dashboard-pricing" className="mb-8 scroll-mt-24 grid grid-cols-1 gap-4 md:grid-cols-3">
          <VBlogFeeCard
            title="Listing Fee"
            feeKas={DAPP_LISTING_FEE_KAS}
            basePoints={HUB_EARN_POINTS.dappDirectoryList}
            tier={krexTier}
          />
          <VBlogFeeCard title="Edit / Update" feeKas={DAPP_LISTING_ACTION_FEE_KAS} tier={krexTier} />
          <VBlogFeeCard title="Delete Fee" feeKas={HUB_DELETE_FEE_KAS.dapps} tier={krexTier} />
        </div>
      ) : null}

      {actionError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-bold text-red-800 dark:text-red-300">{actionError}</p>
        </div>
      ) : null}

      {activeTab === 'create' ? (
        <div id="dapps-dashboard-create" className="scroll-mt-24">
          {state.isConnected ? (
            editId && !editListing ? (
              <p className="py-12 text-center text-zinc-500">Listing not found or you do not have access.</p>
            ) : editListing &&
              editListing.submitterAddress.toLowerCase() !== state.address?.toLowerCase() ? (
              <p className="py-12 text-center text-zinc-500">Only the listing owner can edit this entry.</p>
            ) : (
              <>
                {editListing ? (
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                      Editing: <span className="text-zinc-900 dark:text-zinc-100">{editListing.name}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => goTab('create')}
                      className="text-xs font-bold uppercase tracking-wider text-[#02abb8] hover:underline"
                    >
                      New listing
                    </button>
                  </div>
                ) : null}
                <DAppListingForm listing={editListing} onSubmitted={refresh} />
              </>
            )
          ) : (
            <p className="py-12 text-center text-zinc-500">Connect your Kaspa wallet to list a dApp.</p>
          )}
        </div>
      ) : !state.isConnected ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            Connect your Kaspa wallet to view directory listings and submit your project.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {(activeTab === 'overview' || activeTab === 'listings') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 group hover:border-cyan-500/30 transition-colors">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Active listings</h3>
                <div className="text-4xl font-black text-zinc-900 dark:text-white">
                  {stats.totalListings}{' '}
                  <span className="text-lg text-zinc-500">live</span>
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

          {activeTab === 'listings' && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                  Your directory listings
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <KxFilterDropdown
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    options={[
                      { value: 'all', label: 'All categories' },
                      ...LISTING_CATEGORIES.map((c) => ({
                        value: c.id,
                        label: `${c.emoji} ${c.name}`,
                      })),
                    ]}
                    ariaLabel="Filter by category"
                    triggerClassName="k-control-btn min-w-[160px]"
                    menuClassName="w-56"
                  />
                  <button
                    type="button"
                    onClick={() => goTab('create')}
                    className="k-control-btn !border-cyan-500/30 !bg-cyan-500/10 !text-cyan-800 dark:!text-cyan-300 text-xs"
                  >
                    List a DApp
                  </button>
                </div>
              </div>

              {filteredListings.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">
                  <p>You haven&apos;t published any directory listings yet.</p>
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
                  {filteredListings.map((item) => (
                    <ListingRow
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isDeleting={deletingId === item.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'overview' && (
            <>
              <section>
                <DAppSectionHeader title="List your project on Kasparex dApps" />
                <p className="kx-body">
                  Submit a full project profile for the public dApps directory. Your listing gets its own page with
                  description, links, media, and contact details. Integrated live widgets are reserved for official
                  Kasparex dApps.
                </p>
              </section>

              {stats.totalListings > 0 ? (
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                  <DAppSectionHeader title="By category" />
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
              ) : null}
            </>
          )}
        </div>
      )}
    </DAppPageShell>
  );
}
