'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ChronicleChapterMeta, ChronicleTimeline } from '@/lib/chronicles/types';
import { FilterBar } from '@/components/FilterBar';
import { ViewModeToggle } from './ViewModeToggle';
import type { ChroniclesViewMode } from '@/lib/chronicles/types';
import { filterChaptersByTimeline, searchChapters } from '@/lib/chronicles/filtering';
import { sortChaptersByNumber } from '@/lib/chronicles/sorting';

const timelines: { id: ChronicleTimeline; label: string }[] = [
  { id: 'past', label: 'Past' },
  { id: 'current', label: 'Current' },
  { id: 'future', label: 'Future' },
];

function timelineBadge(t: ChronicleTimeline) {
  const map = {
    past: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200',
    current: 'bg-cyan-500/15 text-[#02abb8] border border-cyan-500/25',
    future: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
  };
  return map[t];
}

export function ChaptersListing({ initialChapters }: { initialChapters: ChronicleChapterMeta[] }) {
  const [search, setSearch] = useState('');
  const [selTimeline, setSelTimeline] = useState<ChronicleTimeline[]>([]);
  const [view, setView] = useState<ChroniclesViewMode>('card');

  const filtered = useMemo(() => {
    let list = sortChaptersByNumber(initialChapters);
    list = searchChapters(list, search);
    list = filterChaptersByTimeline(list, selTimeline);
    return list;
  }, [initialChapters, search, selTimeline]);

  const toggleTimeline = (id: ChronicleTimeline) => {
    setSelTimeline((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const reset = () => {
    setSearch('');
    setSelTimeline([]);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-8">
        <FilterBar search={{ value: search, onChange: setSearch, placeholder: 'Search chapters...' }} onReset={reset}>
          <div className="flex flex-wrap gap-2 items-center shrink-0">
            {timelines.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTimeline(t.id)}
                className={`h-10 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
                  selTimeline.includes(t.id)
                    ? 'border-[#02abb8] bg-[#02abb8]/10 text-[#02abb8]'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <ViewModeToggle value={view} onChange={setView} />
        </FilterBar>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        {filtered.length} chapter{filtered.length !== 1 ? 's' : ''}
      </p>

      {view === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-left text-xs font-black uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Title</th>
                <th className="p-3">Timeline</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.slug} className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50">
                  <td className="p-3 font-mono text-zinc-500">{c.number}</td>
                  <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">{c.title}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${timelineBadge(c.timeline)}`}>
                      {c.timeline}
                    </span>
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
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/chronicles/chapters/${c.slug}`}
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors"
              >
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="text-zinc-400 font-mono mr-2">{c.number}.</span>
                  {c.title}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md shrink-0 ${timelineBadge(c.timeline)}`}>
                  {c.timeline}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {view === 'card' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.slug}
              href={`/chronicles/chapters/${c.slug}`}
              className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 hover:border-cyan-500/35 hover:shadow-lg hover:shadow-cyan-500/5 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs font-mono text-zinc-400">Ch. {c.number}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${timelineBadge(c.timeline)}`}>
                  {c.timeline}
                </span>
              </div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 group-hover:text-[#02abb8] transition-colors mb-2">
                {c.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">{c.teaser}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
