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

export function LocationsListing({ initial }: { initial: ChronicleLocation[] }) {
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [view, setView] = useState<ChroniclesViewMode>('card');

  const tagOptions = useMemo(() => {
    const s = new Set<string>();
    initial.forEach((l) => l.tags.forEach((t) => s.add(t)));
    return [...s].sort();
  }, [initial]);

  const filtered = useMemo(() => {
    let list = sortLocationsByName(initial);
    list = searchLocations(list, search);
    list = filterLocationsByTag(list, tagFilter);
    return list;
  }, [initial, search, tagFilter]);

  return (
    <div>
      <div className="mb-10">
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

      <p className="text-base text-zinc-500 dark:text-zinc-400 mb-6">{filtered.length} locations</p>

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
        <div className="grid gap-6 sm:grid-cols-2">
          {filtered.map((l) => (
            <Link
              key={l.slug}
              href={`/chronicles/locations/${l.slug}`}
              className="group flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden hover:border-cyan-500/35"
            >
              <ChronicleThumb imageUrl={l.featuredImageUrl} alt="" className="h-40 w-full shrink-0" />
              <div className="p-5 sm:p-6">
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-2">
                  <Tooltip content={l.name} side="top" align="start">
                    <span className="block">{l.name}</span>
                  </Tooltip>
                </h3>
                <p className="text-sm text-zinc-500 mb-2">{l.visualStyle}</p>
                <p className="text-base text-zinc-600 dark:text-zinc-400 line-clamp-3">{l.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
