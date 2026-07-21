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
import { applyKrexFeeDiscount } from '@/lib/hub/applyKrexFeeDiscount';
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
import { getBestGatewayUrl } from '@/lib/hub/ipfsStandard';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KX_LISTING_PLACEHOLDER_GRADIENT } from '@/lib/ui/kxListingPlaceholder';
import { executeHubPaidDelete, HUB_DELETE_FEE_KAS } from '@/lib/hub/paidDelete';
import { useKxSystemDialog } from '@/hooks/useKxSystemDialog';
import { collectDappMediaCids } from '@/lib/ipfs/cidUtils';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

const DASHBOARD_TABS: DAppDashboardTab[] = ['create', 'listings'];

const TAB_LABELS: Record<DAppDashboardTab, string> = {
  create: 'List a DApp',
  listings: 'My Listings',
};

const LISTING_CATEGORIES = categories.filter((c) => c.id !== 'all');

function ListingCard({
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
    <KxListingCard accent="dapps" className="h-full flex flex-col">
      <KxListingCardMedia aspectClass="aspect-[16/10]">
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center text-4xl ${KX_LISTING_PLACEHOLDER_GRADIENT}`}>
            {cat?.emoji ?? '⚡'}
          </div>
        )}
        {item.status === 'archived' ? (
          <span className="absolute left-2 top-2 rounded-md border border-zinc-200 bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-600 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-400">
            archived
          </span>
        ) : null}
      </KxListingCardMedia>
      <KxListingCardBody comfortable className="flex flex-1 flex-col">
        <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-zinc-900 dark:text-white">
          {item.name}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {item.shortDescription}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
          {cat ? <span>{cat.name}</span> : null}
          {cat ? <span aria-hidden>•</span> : null}
          <span>
            {item.feeAmountKAS} KAS fee ({item.paymentCurrency})
          </span>
          <span aria-hidden>•</span>
          <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
        </div>
        {item.status === 'active' ? (
          <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <Link href={`/dapps/${item.slug}`} className="k-control-btn flex-1 justify-center text-sm text-center">
              View
            </Link>
            <button
              type="button"
              onClick={() => onEdit(item.id)}
              className="hub-cta-btn k-control-btn flex-1 justify-center text-sm"
              title={`Edit (${DAPP_LISTING_ACTION_FEE_KAS} KAS)`}
            >
              Edit
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => onDelete(item.id)}
              className="k-control-btn justify-center text-sm text-red-600 disabled:opacity-50 dark:text-red-400"
              title={`Delete (${HUB_DELETE_FEE_KAS.dapps} KAS)`}
            >
              {isDeleting ? '…' : 'Delete'}
            </button>
          </div>
        ) : null}
      </KxListingCardBody>
    </KxListingCard>
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

  const [activeTab, setActiveTab] = useState<DAppDashboardTab>('create');
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
        adSlotId="HALO_DAPPS_RIGHT"
        adSlotDomId="ad-slot-dapps-dashboard"
      />

      <StoreWalletBanner config={DAPPS_DASHBOARD_GATE} />

      <div className={`${KX_DASHBOARD_TAB_SHELL} mb-8 flex-wrap`}>
        {DASHBOARD_TABS.map((tab) => (
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
            feeKas={applyKrexFeeDiscount(DAPP_LISTING_FEE_KAS, krexTier)}
            basePoints={HUB_EARN_POINTS.dappDirectoryList}
            tier={krexTier}
          />
          <VBlogFeeCard
            title="Edit / Update"
            feeKas={applyKrexFeeDiscount(DAPP_LISTING_ACTION_FEE_KAS, krexTier)}
            tier={krexTier}
          />
          <VBlogFeeCard
            title="Delete Fee"
            feeKas={applyKrexFeeDiscount(HUB_DELETE_FEE_KAS.dapps, krexTier)}
            tier={krexTier}
          />
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
          {activeTab === 'listings' ? (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-[color:var(--hub-accent-border)] dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Active listings</h3>
                  <div className="text-4xl font-black text-zinc-900 dark:text-white">
                    {stats.totalListings} <span className="text-lg text-zinc-500">live</span>
                  </div>
                </div>
                <div className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-[color:var(--hub-accent-border)] dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Listing fee</h3>
                  <div className="text-4xl font-black text-zinc-900 dark:text-white">
                    {DAPP_LISTING_FEE_KAS} <span className="text-lg text-zinc-500">KAS / KREX</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-black uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                  Your directory listings
                </h2>
                <div className="flex flex-wrap items-center gap-3">
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
                    className="hub-cta-btn k-control-btn text-xs"
                  >
                    List a DApp
                  </button>
                </div>
              </div>

              {filteredListings.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                  <p>You haven&apos;t published any directory listings yet.</p>
                  <button
                    type="button"
                    onClick={() => goTab('create')}
                    className="hub-cta-btn k-control-btn mt-4 text-sm"
                  >
                    Submit first listing
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                  {filteredListings.map((item) => (
                    <ListingCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isDeleting={deletingId === item.id}
                    />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </DAppPageShell>
  );
}
