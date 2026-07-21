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
import { getExplorerTxUrl } from '@/lib/store/utils';
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
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

const DASHBOARD_TABS: ChroniclesCenterTab[] = ['create', 'listings'];

const TAB_LABELS: Record<ChroniclesCenterTab, string> = {
  create: 'Create lore',
  listings: 'My Listings',
};

const KIND_OPTIONS: ChroniclesContentKind[] = ['chapter', 'article', 'character', 'location', 'vehicle'];

function SubmissionRow({
  item,
  onArchive,
  isArchiving,
}: {
  item: ChroniclesCommunitySubmission;
  onArchive: (id: string) => void;
  isArchiving: boolean;
}) {
  return (
    <div className="p-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 flex items-center justify-center flex-shrink-0 font-black text-lg">
        {item.title.slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.title}</h3>
          <ChroniclesCommunityBadge />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mt-1">
          <span>{CHRONICLES_CONTENT_KIND_LABELS[item.kind]}</span>
          <span>•</span>
          <span>
            {item.feeAmountKas} KAS fee ({item.paymentCurrency})
          </span>
          <span>•</span>
          <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
        </div>
        <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{item.summary}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={communityDetailHref(item.kind, item.slug)}
          className="p-2 text-zinc-400 hover:text-[#02abb8] transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="View page"
          aria-label="View page"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
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
        <button
          type="button"
          disabled={isArchiving}
          onClick={() => onArchive(item.id)}
          className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
          title="Archive submission"
          aria-label="Archive submission"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
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
        meta={
          state.address ? <p className="font-mono text-sm text-zinc-500">{state.address}</p> : null
        }
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

              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex flex-col gap-4 border-b border-zinc-200 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
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
                  <div className="p-12 text-center text-zinc-500">
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
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredListings.map((item) => (
                      <SubmissionRow
                        key={item.id}
                        item={item}
                        onArchive={handleArchive}
                        isArchiving={archivingId === item.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
      </MobileDesktopOnlyGate>
    </ChroniclesPageShell>
  );
}
