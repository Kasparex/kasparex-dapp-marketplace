'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ChronicleLocation } from '@/lib/chronicles/types';
import { FilterBar } from '@/components/FilterBar';
import { ViewModeToggle } from './ViewModeToggle';
import type { ChroniclesViewMode } from '@/lib/chronicles/types';
import { searchLocations } from '@/lib/chronicles/filtering';
import { sortLocationsByName } from '@/lib/chronicles/sorting';

export function LocationsListing({ initial }: { initial: ChronicleLocation[] }) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ChroniclesViewMode>('card');

  const filtered = useMemo(() => {
    return searchLocations(sortLocationsByName(initial), search);
  }, [initial, search]);

  return (
    <div>
      <div className="mb-8">
        <FilterBar
          search={{ value: search, onChange: setSearch, placeholder: 'Search locations...' }}
          onReset={() => setSearch('')}
        >
          <ViewModeToggle value={view} onChange={setView} />
        </FilterBar>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{filtered.length} locations</p>

      {view === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-left text-xs font-black uppercase text-zinc-500">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Style</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.slug} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="p-3 font-semibold">{l.name}</td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400 text-xs">{l.visualStyle}</td>
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
        <ul className="space-y-2">
          {filtered.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/chronicles/locations/${l.slug}`}
                className="block p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/30 font-bold text-zinc-900 dark:text-zinc-100"
              >
                {l.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {view === 'card' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((l) => (
            <Link
              key={l.slug}
              href={`/chronicles/locations/${l.slug}`}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-cyan-500/35 bg-white dark:bg-zinc-900/40"
            >
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-2">{l.name}</h3>
              <p className="text-xs text-zinc-500 mb-2">{l.visualStyle}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">{l.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
