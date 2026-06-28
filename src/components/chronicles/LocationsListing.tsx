'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ChronicleLocation } from '@/lib/chronicles/types';
import { FilterBar } from '@/components/FilterBar';
import { ChroniclesViewSwitcher } from './ChroniclesViewSwitcher';
import type { ChroniclesViewMode } from '@/lib/chronicles/types';
import { filterLocationsByTag, searchLocations } from '@/lib/chronicles/filtering';
import { sortLocationsByName } from '@/lib/chronicles/sorting';
import { ChronicleThumb } from './ChronicleFeaturedVisual';
import { ChroniclesFilterDropdown } from './ChroniclesFilterDropdown';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import { ChronicleListingCard } from '@/components/chronicles/ChronicleListingCard';
import { communityDetailHref } from '@/lib/chronicles/communityRoutes';
import { ChroniclesCommunityBadge } from '@/components/chronicles/ChroniclesCommunityBadge';
import { KxBadge } from '@/components/ui/KxBadge';
import { chronicleTagBadgeVariant } from '@/lib/chronicles/chronicleTagBadge';
import { useChroniclesCommunitySubmissions } from '@/hooks/useChroniclesCommunitySubmissions';
import { communityLocationToEntity } from '@/lib/chronicles/communityAdapters';

export function LocationsListing({
  initial,
  title = 'Locations',
  countLabel = 'location',
}: {
  initial: ChronicleLocation[];
  title?: string;
  countLabel?: string;
}) {
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [view, setView] = useState<ChroniclesViewMode>('card');

  const tagOptions = useMemo(() => {
    const s = new Set<string>();
    initial.forEach((l) => l.tags.forEach((t) => s.add(t)));
    return [...s].sort();
  }, [initial]);

  const { items: communityItems } = useChroniclesCommunitySubmissions({ kind: 'location' });

  const allLocations = useMemo(() => {
    const community = communityItems.map(communityLocationToEntity);
    return [...initial, ...community];
  }, [initial, communityItems]);

  const filtered = useMemo(() => {
    let list = sortLocationsByName(allLocations);
    list = searchLocations(list, search);
    list = filterLocationsByTag(list, tagFilter);
    return list;
  }, [allLocations, search, tagFilter]);

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
          search={{ value: search, onChange: setSearch, placeholder: 'Search locations...' }}
          onReset={() => {
            setSearch('');
            setTagFilter('');
          }}
        >
          <ChroniclesFilterDropdown
            ariaLabel="Filter by tag"
            value={tagFilter}
            onChange={setTagFilter}
            allLabel="All tags"
            options={tagOptions.map((t) => ({ value: t, label: t }))}
          />
          <ChroniclesViewSwitcher value={view} onChange={setView} />
        </FilterBar>
      </div>

      {view === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-base">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-left text-xs font-black uppercase text-zinc-500">
              <tr>
                <th className="p-3 w-16"></th>
                <th className="p-3">Name</th>
                <th className="p-3">Style</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.slug} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="p-3">
                    <ChronicleThumb imageUrl={l.featuredImageUrl} alt="" className="w-12 h-12 shrink-0" />
                  </td>
                  <td className="p-3 font-semibold">{l.name}</td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400 text-sm">{l.visualStyle}</td>
                  <td className="p-3 text-right">
                    <Link href={`/chronicles/locations/${l.slug}`} className="text-[#02abb8] font-bold text-xs uppercase">
                      View
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
          {filtered.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/chronicles/locations/${l.slug}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/30 font-bold text-zinc-900 dark:text-zinc-100"
              >
                <ChronicleThumb imageUrl={l.featuredImageUrl} alt="" className="w-14 h-14 shrink-0" />
                <span className="min-w-0">{l.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {view === 'card' && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => (
            <ChronicleListingCard
              key={l.slug}
              href={
                'isCommunity' in l && l.isCommunity
                  ? communityDetailHref('location', l.slug)
                  : `/chronicles/locations/${l.slug}`
              }
              imageUrl={l.featuredImageUrl}
              alt={l.name}
              title={l.name}
              description={l.summary}
              badges={
                <>
                  {l.tags.slice(0, 3).map((t) => (
                    <KxBadge key={t} variant={chronicleTagBadgeVariant(t)}>
                      {t}
                    </KxBadge>
                  ))}
                  {'isCommunity' in l && l.isCommunity ? <ChroniclesCommunityBadge /> : null}
                </>
              }
              footer={<span className="text-xs text-zinc-500">{l.visualStyle}</span>}
            />
          ))}
        </div>
      )}
    </div>
  );
}
