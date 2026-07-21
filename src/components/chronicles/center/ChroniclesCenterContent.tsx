'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { ChroniclesPageShell } from '@/components/chronicles/ChroniclesPageShell';
import { StoreWalletBanner } from '@/components/store/StoreWalletBanner';
import { CHRONICLES_CENTER_GATE } from '@/lib/hub/gateConfigs';
import {
  parseChroniclesCenterTab,
  chroniclesCenterTabHref,
  type ChroniclesCenterTab,
} from '@/lib/chronicles/centerTabs';
import {
  CHRONICLES_CONTENT_KIND_LABELS,
  CHRONICLES_SUBMISSION_FEES_KAS,
  archiveCommunitySubmissionLocal,
  getCommunitySubmissionById,
  type ChroniclesCommunitySubmission,
  type ChroniclesContentKind,
} from '@/lib/chronicles/communitySubmissions';
import { useChroniclesCommunitySubmissions } from '@/hooks/useChroniclesCommunitySubmissions';
import { ChroniclesListingForm } from '@/components/chronicles/center/ChroniclesListingForm';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { ChroniclesCommunityBadge } from '@/components/chronicles/ChroniclesCommunityBadge';
import Link from 'next/link';
import { communityDetailHref } from '@/lib/chronicles/communityRoutes';
import {
  KX_DASHBOARD_TAB_SHELL,
  KX_DASHBOARD_TAB_BTN,
  KX_DASHBOARD_TAB_BTN_ACTIVE,
} from '@/lib/hub/shellTokens';
import { HubDashboardPageHeader } from '@/components/hub/HubDashboardPageHeader';
import { VBlogFeeCard } from '@/components/vblog/VBlogPricingCards';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { MobileDesktopOnlyGate } from '@/components/hub/MobileDesktopOnlyGate';
import { useKxSystemDialog } from '@/hooks/useKxSystemDialog';
import { executeHubPaidDelete, HUB_DELETE_FEE_KAS } from '@/lib/hub/paidDelete';
import { collectChroniclesMediaCids } from '@/lib/ipfs/cidUtils';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KX_LISTING_PLACEHOLDER_GRADIENT } from '@/lib/ui/kxListingPlaceholder';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

const DASHBOARD_TABS: ChroniclesCenterTab[] = ['create', 'listings'];

const TAB_LABELS: Record<ChroniclesCenterTab, string> = {
  create: 'Create lore',
  listings: 'My Listings',
};

const KIND_OPTIONS: ChroniclesContentKind[] = ['chapter', 'article', 'character', 'location', 'vehicle'];

function SubmissionCard({
  item,
  onArchive,
  isArchiving,
}: {
  item: ChroniclesCommunitySubmission;
  onArchive: (id: string) => void;
  isArchiving: boolean;
}) {
  return (
    <KxListingCard accent="chronicles" className="h-full flex flex-col">
      <KxListingCardMedia aspectClass="aspect-[16/10]">
        <div className={`flex h-full w-full items-center justify-center text-4xl font-black text-zinc-500 dark:text-zinc-400 ${KX_LISTING_PLACEHOLDER_GRADIENT}`}>
          {item.title.slice(0, 1).toUpperCase()}
        </div>
        <span className="absolute left-2 top-2 rounded-md border border-zinc-200 bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-600 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300">
          {CHRONICLES_CONTENT_KIND_LABELS[item.kind]}
        </span>
      </KxListingCardMedia>
      <KxListingCardBody comfortable className="flex flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-zinc-900 dark:text-white">
            {item.title}
          </h3>
          <ChroniclesCommunityBadge />
        </div>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {item.summary}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
          <span>
            {item.feeAmountKas} KAS fee ({item.paymentCurrency})
          </span>
          <span aria-hidden>•</span>
          <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <Link
            href={communityDetailHref(item.kind, item.slug)}
            className="k-control-btn flex-1 justify-center text-sm text-center"
          >
            View
          </Link>
          <button
            type="button"
            disabled={isArchiving}
            onClick={() => onArchive(item.id)}
            className="k-control-btn flex-1 justify-center text-sm text-red-600 disabled:opacity-50 dark:text-red-400"
            title="Delete submission"
          >
            {isArchiving ? '…' : 'Delete'}
          </button>
        </div>
      </KxListingCardBody>
    </KxListingCard>
  );
}

export function ChroniclesCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useKaspaWallet();
  const { tier: krexTier } = useKREXBalance();
  const { confirm, alert } = useKxSystemDialog();
  const { items, refresh } = useChroniclesCommunitySubmissions({
    authorAddress: state.address ?? undefined,
  });

  const [activeTab, setActiveTab] = useState<ChroniclesCenterTab>('create');
  const [kindFilter, setKindFilter] = useState<ChroniclesContentKind | 'all'>('all');
  const [archivingId, setArchivingId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(parseChroniclesCenterTab(searchParams.get('tab')));
  }, [searchParams]);

  const goTab = useCallback(
    (tab: ChroniclesCenterTab) => {
      setActiveTab(tab);
      router.replace(chroniclesCenterTabHref(tab));
    },
    [router],
  );

  const filteredListings = useMemo(() => {
    if (kindFilter === 'all') return items;
    return items.filter((i) => i.kind === kindFilter);
  }, [items, kindFilter]);

  const stats = useMemo(() => {
    const byKind = KIND_OPTIONS.reduce(
      (acc, kind) => {
        acc[kind] = items.filter((i) => i.kind === kind).length;
        return acc;
      },
      {} as Record<ChroniclesContentKind, number>,
    );
    return { totalListings: items.length, byKind };
  }, [items]);

  const handleArchive = async (id: string) => {
    const existing = getCommunitySubmissionById(id);
    if (!existing) return;
    if (!state.isConnected || !state.provider || !state.address) {
      await alert({
        title: 'Wallet required',
        message: 'Connect your Kaspa wallet to delete this submission.',
      });
      return;
    }
    const deleteFee = HUB_DELETE_FEE_KAS.chronicles;
    const ok = await confirm({
      title: 'Archive submission',
      message: `Archive "${existing.title}"? A ${deleteFee} KAS fee applies.`,
      confirmLabel: 'Archive',
      destructive: true,
    });
    if (!ok) return;

    setArchivingId(id);
    try {
      const result = await executeHubPaidDelete({
        kind: 'chronicles',
        id,
        feeKas: deleteFee,
        payerProvider: state.provider as KaspaWalletProvider,
        payerAddress: state.address,
        mediaCids: collectChroniclesMediaCids(existing),
        removeLocal: () => archiveCommunitySubmissionLocal(id),
      });
      if (!result.ok) throw new Error(result.error ?? 'Delete failed');
      refresh();
    } catch (err) {
      await alert({
        title: 'Archive failed',
        message: err instanceof Error ? err.message : 'Failed to archive submission',
      });
    } finally {
      setArchivingId(null);
    }
  };

  const chapterFee = CHRONICLES_SUBMISSION_FEES_KAS.chapter;

  return (
    <ChroniclesPageShell
      sidebar={{
        dashboardTab: activeTab,
        onDashboardTabChange: (tab) => goTab(tab),
        totalListings: stats.totalListings,
      }}
    >
      <MobileDesktopOnlyGate title="Chronicles Center" backHref="/chronicles" backLabel="Back to Chronicles">
      <HubDashboardPageHeader
        kicker="Chronicles dashboard"
        title="Chronicles"
        titleAccent="Center"
        excerpt="Submit community lore with modular Hub pricing, KREX discounts, and Hub Points."
        adSlotId="HALO_CHRONICLES_RIGHT"
      />

      <StoreWalletBanner config={CHRONICLES_CENTER_GATE} />

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
        <div id="chronicles-dashboard-pricing" className="mb-8 scroll-mt-24 grid grid-cols-1 gap-4 md:grid-cols-3">
          <VBlogFeeCard
            title="Chapter fee"
            feeKas={CHRONICLES_SUBMISSION_FEES_KAS.chapter}
            tier={krexTier}
          />
          <VBlogFeeCard
            title="Article fee"
            feeKas={CHRONICLES_SUBMISSION_FEES_KAS.article}
            basePoints={HUB_EARN_POINTS.chroniclesArticleCreate}
            tier={krexTier}
          />
          <VBlogFeeCard title="Delete Fee" feeKas={HUB_DELETE_FEE_KAS.chronicles} tier={krexTier} />
        </div>
      ) : null}

      {activeTab === 'create' ? (
        <div id="chronicles-dashboard-create" className="scroll-mt-24">
          {state.isConnected ? (
            <ChroniclesListingForm onSubmitted={refresh} />
          ) : (
            <p className="py-12 text-center text-zinc-500">Connect your Kaspa wallet to submit community lore.</p>
          )}
        </div>
      ) : !state.isConnected ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            Connect your Kaspa wallet to view submissions and create community lore.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeTab === 'listings' ? (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-[color:var(--hub-accent-border)] dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Active submissions</h3>
                  <div className="text-4xl font-black text-zinc-900 dark:text-white">
                    {stats.totalListings} <span className="text-lg text-zinc-500">live</span>
                  </div>
                </div>
                <div className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-[color:var(--hub-accent-border)] dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Chapter listing fee</h3>
                  <div className="text-4xl font-black text-zinc-900 dark:text-white">
                    {chapterFee} <span className="text-lg text-zinc-500">KAS / KREX</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-black uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                  Your community submissions
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <KxFilterDropdown
                    value={kindFilter}
                    onChange={setKindFilter}
                    options={[
                      { value: 'all', label: 'All types' },
                      ...KIND_OPTIONS.map((k) => ({
                        value: k,
                        label: CHRONICLES_CONTENT_KIND_LABELS[k],
                      })),
                    ]}
                    ariaLabel="Filter by content type"
                    triggerClassName="k-control-btn min-w-[160px]"
                    menuClassName="w-56"
                  />
                  <button
                    type="button"
                    onClick={() => goTab('create')}
                    className="hub-cta-btn k-control-btn text-xs"
                  >
                    Create lore
                  </button>
                </div>
              </div>

              {filteredListings.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                  <p>You haven&apos;t published any community lore yet.</p>
                  <button
                    type="button"
                    onClick={() => goTab('create')}
                    className="hub-cta-btn k-control-btn mt-4 text-sm"
                  >
                    Submit first entry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                  {filteredListings.map((item) => (
                    <SubmissionCard
                      key={item.id}
                      item={item}
                      onArchive={handleArchive}
                      isArchiving={archivingId === item.id}
                    />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
      </MobileDesktopOnlyGate>
    </ChroniclesPageShell>
  );
}
