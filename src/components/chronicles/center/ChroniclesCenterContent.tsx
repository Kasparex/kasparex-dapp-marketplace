'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { ChroniclesHaloHeader } from '@/components/chronicles/ChroniclesHaloHeader';
import { ChroniclesCommunityBadge } from '@/components/chronicles/ChroniclesCommunityBadge';
import { ChroniclesSubmissionForm } from '@/components/chronicles/center/ChroniclesSubmissionForm';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { StoreWalletBanner } from '@/components/store/StoreWalletBanner';
import {
  chroniclesCenterTabHref,
  parseChroniclesCenterTab,
  type ChroniclesCenterTab,
} from '@/lib/chronicles/centerTabs';
import {
  CHRONICLES_CONTENT_KIND_LABELS,
  CHRONICLES_SUBMISSION_FEES_KAS,
  archiveCommunitySubmission,
} from '@/lib/chronicles/communitySubmissions';
import { useChroniclesCommunitySubmissions } from '@/hooks/useChroniclesCommunitySubmissions';
import { getExplorerTxUrl } from '@/lib/store/utils';

const TAB_LABELS: Record<ChroniclesCenterTab, string> = {
  overview: 'Overview',
  submissions: 'My submissions',
  create: 'Create',
};

export function ChroniclesCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseChroniclesCenterTab(searchParams.get('tab'));
  const { state } = useKaspaWallet();
  const { items, refresh } = useChroniclesCommunitySubmissions({
    authorAddress: state.address ?? undefined,
  });

  const myItems = useMemo(() => {
    if (!state.address) return [];
    return items;
  }, [items, state.address]);

  const setTab = useCallback(
    (next: ChroniclesCenterTab) => {
      router.push(chroniclesCenterTabHref(next));
    },
    [router],
  );

  return (
    <div>
      <ChroniclesHaloHeader
        kicker="Community hub"
        title="Chronicles Center"
        titleAccent="Center"
        subtitle="Create and submit community lore: chapters, articles, characters, locations, and tech. Paid submissions use KAS or KREX."
        showDefaultActions={false}
        actions={
          <>
            <button type="button" className="k-control-btn !border-violet-500/35 !text-violet-800 dark:!text-violet-200" onClick={() => setTab('create')}>
              New submission
            </button>
            <Link href="/chronicles/chapters" className="k-control-btn">
              Browse chapters
            </Link>
          </>
        }
      />

      <div className="mb-8">
        <KxTabStrip
          value={tab}
          onChange={setTab}
          scrollable
          ariaLabel="Chronicles Center sections"
          options={(
            ['overview', 'submissions', 'create'] as ChroniclesCenterTab[]
          ).map((t) => ({ value: t, label: TAB_LABELS[t] }))}
        />
      </div>

      {!state.isConnected ? (
        <div className="mb-8">
          <StoreWalletBanner message="Connect your Kaspa wallet to submit and manage community lore." />
        </div>
      ) : null}

      {tab === 'overview' ? (
        <div className="space-y-8">
          <DAppSectionHeader
            title="Community creation hub"
            hint="Submit fan lore and original stories. Content appears in Chronicles listings with a Community badge."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(CHRONICLES_SUBMISSION_FEES_KAS).map(([kind, fee]) => (
              <div
                key={kind}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 hover:border-violet-400/35 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-black text-zinc-900 dark:text-zinc-100">
                    {CHRONICLES_CONTENT_KIND_LABELS[kind as keyof typeof CHRONICLES_CONTENT_KIND_LABELS]}
                  </h3>
                  <ChroniclesCommunityBadge />
                </div>
                <p className="text-sm text-zinc-500 mb-4">Submit from the Create tab. Pay with KAS or KREX.</p>
                <p className="text-lg font-black text-violet-700 dark:text-violet-300">{fee} KAS</p>
                <button type="button" className="k-control-btn text-xs mt-4" onClick={() => setTab('create')}>
                  Start
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'submissions' ? (
        <div className="space-y-6">
          <DAppSectionHeader title="My submissions" hint="Community lore you have submitted from this browser." />
          {!state.isConnected ? (
            <p className="text-base text-zinc-500">Connect a wallet to see your submissions.</p>
          ) : myItems.length === 0 ? (
            <p className="text-base text-zinc-500">No submissions yet. Create your first chapter or article.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {myItems.map((item) => (
                <li key={item.id} className="p-4 sm:p-5 bg-white dark:bg-zinc-900/30">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
                        <ChroniclesCommunityBadge />
                        <span className="text-[10px] font-bold uppercase text-violet-600 dark:text-violet-400">
                          {CHRONICLES_CONTENT_KIND_LABELS[item.kind]}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 line-clamp-2">{item.summary}</p>
                      <p className="text-xs text-zinc-400 mt-2">
                        {item.feeAmountKas} KAS ({item.paymentCurrency}) · {new Date(item.submittedAt).toLocaleString()}
                      </p>
                      {item.feeTxHash ? (
                        <a href={getExplorerTxUrl(item.feeTxHash)} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-600 dark:text-violet-400 hover:underline mt-1 inline-block">
                          View payment tx
                        </a>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="k-control-btn text-xs shrink-0"
                      onClick={() => {
                        archiveCommunitySubmission(item.id);
                        refresh();
                      }}
                    >
                      Archive
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === 'create' ? <ChroniclesSubmissionForm onSubmitted={refresh} /> : null}
    </div>
  );
}
