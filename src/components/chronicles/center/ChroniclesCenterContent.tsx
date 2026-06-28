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
  archiveCommunitySubmission,
  type ChroniclesCommunitySubmission,
  type ChroniclesContentKind,
} from '@/lib/chronicles/communitySubmissions';
import { useChroniclesCommunitySubmissions } from '@/hooks/useChroniclesCommunitySubmissions';
import { ChroniclesListingForm } from '@/components/chronicles/center/ChroniclesListingForm';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { getExplorerTxUrl } from '@/lib/store/utils';
import { ChroniclesCommunityBadge } from '@/components/chronicles/ChroniclesCommunityBadge';
import Link from 'next/link';
import { communityDetailHref } from '@/lib/chronicles/communityRoutes';

const TAB_LABELS: Record<ChroniclesCenterTab, string> = {
  overview: 'Overview',
  listings: 'My Listings',
  create: 'Create lore',
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
  const { items, refresh } = useChroniclesCommunitySubmissions({
    authorAddress: state.address ?? undefined,
  });

  const [activeTab, setActiveTab] = useState<ChroniclesCenterTab>('overview');
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
    if (!confirm('Archive this community submission?')) return;
    setArchivingId(id);
    archiveCommunitySubmission(id);
    refresh();
    setArchivingId(null);
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
      <div className="mb-10">
        <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Chronicles dashboard</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
          Chronicles{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-500">Center</span>
        </h1>
        {state.address ? <p className="text-sm text-zinc-500 font-mono">{state.address}</p> : null}
      </div>

      <StoreWalletBanner config={CHRONICLES_CENTER_GATE} />

      <div className="flex items-center gap-1 p-1 k-control-group w-fit mb-8 flex-wrap">
        {(Object.keys(TAB_LABELS) as ChroniclesCenterTab[]).map((tab) => (
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
            <ChroniclesListingForm onSubmitted={refresh} />
          ) : (
            <p className="text-center text-zinc-500 py-12">Connect your Kaspa wallet to submit community lore.</p>
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
          {(activeTab === 'overview' || activeTab === 'listings') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 group hover:border-cyan-500/30 transition-colors">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Active submissions</h3>
                <div className="text-4xl font-black text-zinc-900 dark:text-white">
                  {stats.totalListings} <span className="text-lg text-zinc-500">live</span>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 group hover:border-cyan-500/30 transition-colors">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Chapter listing fee</h3>
                <div className="text-4xl font-black text-zinc-900 dark:text-white">
                  {chapterFee} <span className="text-lg text-zinc-500">KAS / KREX</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                  Your community submissions
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
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
                    className="k-control-btn !border-cyan-500/30 !bg-cyan-500/10 !text-cyan-800 dark:!text-cyan-300 text-xs"
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
                    className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:from-cyan-700 hover:to-teal-700 transition-colors"
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
          )}

          {activeTab === 'overview' && (
            <>
              <section>
                <DAppSectionHeader title="Submit community lore on Krex's Chronicles" />
                <p className="kx-body">
                  Create chapters, articles, characters, locations, and tech entries for the community codex. Paid
                  submissions appear in public listings with a Community badge. Official canon remains curated
                  separately.
                </p>
              </section>

              {stats.totalListings > 0 ? (
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                  <DAppSectionHeader title="By content type" />
                  <div className="flex flex-wrap gap-2">
                    {KIND_OPTIONS.filter((k) => stats.byKind[k] > 0).map((k) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                      >
                        {CHRONICLES_CONTENT_KIND_LABELS[k]}
                        <span className="font-bold text-[#02abb8]">{stats.byKind[k]}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </ChroniclesPageShell>
  );
}
