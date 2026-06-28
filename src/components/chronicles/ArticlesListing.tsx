'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FilterBar } from '@/components/FilterBar';
import { ChroniclesViewSwitcher } from './ChroniclesViewSwitcher';
import type { ChroniclesViewMode } from '@/lib/chronicles/types';
import { ChronicleListingCard } from '@/components/chronicles/ChronicleListingCard';
import { ChroniclesCommunityBadge } from '@/components/chronicles/ChroniclesCommunityBadge';
import { useChroniclesCommunitySubmissions } from '@/hooks/useChroniclesCommunitySubmissions';
import { communityDetailHref } from '@/lib/chronicles/communityRoutes';

export function ArticlesListing({ title = 'Articles' }: { title?: string }) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ChroniclesViewMode>('card');
  const { items } = useChroniclesCommunitySubmissions({ kind: 'article' });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{title}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {filtered.length} article{filtered.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <FilterBar
          flexWrap
          search={{ value: search, onChange: setSearch, placeholder: 'Search articles...' }}
          onReset={() => setSearch('')}
        >
          <ChroniclesViewSwitcher value={view} onChange={setView} />
        </FilterBar>
      </div>

      {view === 'card' && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <ChronicleListingCard
              key={a.slug}
              href={communityDetailHref('article', a.slug)}
              imageUrl={a.featuredImageUrl}
              alt={a.title}
              title={a.title}
              description={a.summary}
              badges={<ChroniclesCommunityBadge />}
            />
          ))}
        </div>
      )}

      {view === 'compact' && (
        <ul className="space-y-3">
          {filtered.map((a) => (
            <li key={a.slug}>
              <Link
                href={communityDetailHref('article', a.slug)}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/30 transition-colors"
              >
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{a.title}</span>
                <ChroniclesCommunityBadge />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
