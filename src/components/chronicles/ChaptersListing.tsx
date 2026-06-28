'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ChronicleChapterMeta, ChronicleTimeline } from '@/lib/chronicles/types';
import { FilterBar } from '@/components/FilterBar';
import { ChroniclesViewSwitcher } from './ChroniclesViewSwitcher';
import type { ChroniclesViewMode } from '@/lib/chronicles/types';
import { filterChaptersByTimeline, searchChapters } from '@/lib/chronicles/filtering';
import { sortChaptersByNumber } from '@/lib/chronicles/sorting';
import { ChronicleThumb } from './ChronicleFeaturedVisual';
import { ChroniclesFilterDropdown } from './ChroniclesFilterDropdown';
import { ChronicleListingCard } from '@/components/chronicles/ChronicleListingCard';
import { useChroniclesUnlock } from '@/components/chronicles/ChroniclesUnlockProvider';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useChroniclesEntitlements } from '@/lib/chronicles/entitlements/useChroniclesEntitlements';
import { communityDetailHref } from '@/lib/chronicles/communityRoutes';
import { ChroniclesCommunityBadge } from '@/components/chronicles/ChroniclesCommunityBadge';
import { KxBadge } from '@/components/ui/KxBadge';
import { chronicleTimelineBadgeVariant, chronicleTagBadgeVariant } from '@/lib/chronicles/chronicleTagBadge';
import { useChroniclesCommunitySubmissions } from '@/hooks/useChroniclesCommunitySubmissions';
import { communityChapterToMeta } from '@/lib/chronicles/communityAdapters';

const timelines: { id: ChronicleTimeline; label: string }[] = [
  { id: 'past', label: 'Past' },
  { id: 'current', label: 'Current' },
  { id: 'future', label: 'Future' },
];

function ChapterCard({ c }: { c: ChronicleChapterMeta & { isCommunity?: boolean } }) {
  const { state } = useKaspaWallet();
  const { isUnlocked } = useChroniclesEntitlements(state.address);
  const { openUnlock } = useChroniclesUnlock();
  const isPremium = c.access && c.access.tier !== 'free';
  const locked = Boolean(isPremium && c.access && !isUnlocked(c.access.contentId));
  const href = locked
    ? undefined
    : 'isCommunity' in c && c.isCommunity
      ? communityDetailHref('chapter', c.slug)
      : `/chronicles/chapters/${c.slug}`;

  return (
    <ChronicleListingCard
      href={href}
      onClick={locked && c.access ? () => openUnlock(c.access!.contentId) : undefined}
      imageUrl={c.featuredImageUrl}
      alt={c.title}
      title={c.title}
      description={c.teaser}
      badges={
        <>
          {'isCommunity' in c && c.isCommunity ? <ChroniclesCommunityBadge /> : null}
          {isPremium ? <KxBadge variant="amber">Premium</KxBadge> : null}
          {c.relatedGameSlug === 'minecore' ? (
            <KxBadge variant={chronicleTagBadgeVariant('minecore')}>minecore</KxBadge>
          ) : null}
          <KxBadge variant={chronicleTimelineBadgeVariant(c.timeline)}>{c.timeline}</KxBadge>
        </>
      }
      footer={
        <span className="text-xs font-mono text-zinc-500">Chapter {c.number}</span>
      }
    />
  );
}

export function ChaptersListing({
  initialChapters,
  title = 'Chapters',
  countLabel = 'chapter',
}: {
  initialChapters: ChronicleChapterMeta[];
  title?: string;
  countLabel?: string;
}) {
  const [search, setSearch] = useState('');
  const [timelineFilter, setTimelineFilter] = useState<ChronicleTimeline | ''>('');
  const [view, setView] = useState<ChroniclesViewMode>('card');
  const { items: communityItems } = useChroniclesCommunitySubmissions({ kind: 'chapter' });

  const allChapters = useMemo(() => {
    const community = communityItems.map(communityChapterToMeta);
    return [...initialChapters, ...community];
  }, [initialChapters, communityItems]);

  const filtered = useMemo(() => {
    let list = sortChaptersByNumber(allChapters).slice().reverse();
    list = searchChapters(list, search);
    list = filterChaptersByTimeline(list, timelineFilter ? [timelineFilter] : []);
    return list;
  }, [allChapters, search, timelineFilter]);

  const reset = () => {
    setSearch('');
    setTimelineFilter('');
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{title}</h2>
        <p className="kx-body">
          {filtered.length} {countLabel}
          {filtered.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <FilterBar
          flexWrap
          search={{ value: search, onChange: setSearch, placeholder: 'Search chapters...' }}
          onReset={reset}
        >
          <ChroniclesFilterDropdown
            ariaLabel="Filter by timeline"
            value={timelineFilter}
            onChange={(v) => setTimelineFilter(v as ChronicleTimeline | '')}
            allLabel="All timelines"
            options={timelines.map((t) => ({ value: t.id, label: t.label }))}
            minWidthClassName="min-w-[170px]"
          />
          <ChroniclesViewSwitcher value={view} onChange={setView} />
        </FilterBar>
      </div>

      {view === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-base">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-left text-sm font-black uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="p-3 w-16"></th>
                <th className="p-3">#</th>
                <th className="p-3">Title</th>
                <th className="p-3">Timeline</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.slug}
                  className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50"
                >
                  <td className="p-3 w-16">
                    <ChronicleThumb
                      imageUrl={c.featuredImageUrl}
                      alt=""
                      className="w-12 h-12 shrink-0"
                    />
                  </td>
                  <td className="p-3 font-mono text-zinc-500">{c.number}</td>
                  <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">{c.title}</td>
                  <td className="p-3">
                    <KxBadge variant={chronicleTimelineBadgeVariant(c.timeline)}>{c.timeline}</KxBadge>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/chronicles/chapters/${c.slug}`} className="text-[#02abb8] font-bold text-xs uppercase">
                      Read
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'compact' && (
        <ul className="space-y-3">
          {filtered.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/chronicles/chapters/${c.slug}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors"
              >
                <ChronicleThumb imageUrl={c.featuredImageUrl} alt="" className="w-14 h-14 shrink-0" />
                <div className="min-w-0 flex-1 flex items-center justify-between gap-4">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    <span className="text-zinc-400 font-mono mr-2">{c.number}.</span>
                    {c.title}
                  </span>
                  <KxBadge variant={chronicleTimelineBadgeVariant(c.timeline)} className="shrink-0">
                    {c.timeline}
                  </KxBadge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {view === 'card' && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <ChapterCard key={c.slug} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
