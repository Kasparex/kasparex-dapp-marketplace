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
import { KxListingCard, KxListingCardBody } from '@/components/kx/KxListingCard';
import { ChroniclesCommunityBadge } from '@/components/chronicles/ChroniclesCommunityBadge';
import { useChroniclesCommunitySubmissions } from '@/hooks/useChroniclesCommunitySubmissions';
import { communityChapterToMeta } from '@/lib/chronicles/communityAdapters';

const timelines: { id: ChronicleTimeline; label: string }[] = [
  { id: 'past', label: 'Past' },
  { id: 'current', label: 'Current' },
  { id: 'future', label: 'Future' },
];

function timelineBadge(t: ChronicleTimeline) {
  const map = {
    past: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200',
    current: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/25',
    future: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
  };
  return map[t];
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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${timelineBadge(c.timeline)}`}>
                      {c.timeline}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/chronicles/chapters/${c.slug}`} className="text-violet-600 dark:text-violet-400 font-bold text-xs uppercase">
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
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors"
              >
                <ChronicleThumb imageUrl={c.featuredImageUrl} alt="" className="w-14 h-14 shrink-0" />
                <div className="min-w-0 flex-1 flex items-center justify-between gap-4">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    <span className="text-zinc-400 font-mono mr-2">{c.number}.</span>
                    {c.title}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md shrink-0 ${timelineBadge(c.timeline)}`}>
                    {c.timeline}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {view === 'card' && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <KxListingCard key={c.slug} href={`/chronicles/chapters/${c.slug}`} accent="chronicles">
              <ChronicleThumb imageUrl={c.featuredImageUrl} alt="" className="h-40 w-full shrink-0" />
              <KxListingCardBody>
                <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                  <span className="text-sm font-mono text-zinc-400">Ch. {c.number}</span>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {'isCommunity' in c && c.isCommunity ? <ChroniclesCommunityBadge /> : null}
                    {c.access && c.access.tier !== 'free' ? (
                      <span className="text-xs font-black uppercase px-2 py-1 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25">
                        Vault
                      </span>
                    ) : null}
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded-md ${timelineBadge(c.timeline)}`}>
                      {c.timeline}
                    </span>
                  </div>
                </div>
                <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[#02abb8] transition-colors mb-2">
                  {c.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">{c.teaser}</p>
              </KxListingCardBody>
            </KxListingCard>
          ))}
        </div>
      )}
    </div>
  );
}
