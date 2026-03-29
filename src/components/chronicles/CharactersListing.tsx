'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CharacterKind, ChronicleCharacter } from '@/lib/chronicles/types';
import { FilterBar } from '@/components/FilterBar';
import { ChroniclesViewSwitcher } from './ChroniclesViewSwitcher';
import type { ChroniclesViewMode } from '@/lib/chronicles/types';
import { filterCharactersByKind, searchCharacters } from '@/lib/chronicles/filtering';
import { sortCharactersByName } from '@/lib/chronicles/sorting';
import { ChronicleThumb } from './ChronicleFeaturedVisual';
import { ChroniclesFilterDropdown } from './ChroniclesFilterDropdown';
import { Tooltip } from '@/components/ui/Tooltip';

const kinds: { id: CharacterKind; label: string }[] = [
  { id: 'person', label: 'People' },
  { id: 'ai', label: 'AI' },
  { id: 'faction', label: 'Factions' },
  { id: 'organization', label: 'Organizations' },
  { id: 'unknown', label: 'Unknown' },
];

export function CharactersListing({ initial }: { initial: ChronicleCharacter[] }) {
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<CharacterKind | ''>('');
  const [view, setView] = useState<ChroniclesViewMode>('card');

  const filtered = useMemo(() => {
    let list = sortCharactersByName(initial);
    list = searchCharacters(list, search);
    list = filterCharactersByKind(list, kindFilter ? [kindFilter] : []);
    return list;
  }, [initial, search, kindFilter]);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-10">
        <FilterBar
          flexWrap
          search={{ value: search, onChange: setSearch, placeholder: 'Search characters...' }}
          onReset={() => {
            setSearch('');
            setKindFilter('');
          }}
        >
          <ChroniclesFilterDropdown
            ariaLabel="Filter by kind"
            value={kindFilter}
            onChange={(v) => setKindFilter(v as CharacterKind | '')}
            allLabel="All kinds"
            options={kinds.map((k) => ({ value: k.id, label: k.label }))}
          />
          <ChroniclesViewSwitcher value={view} onChange={setView} />
        </FilterBar>
      </div>

      <p className="text-base text-zinc-500 dark:text-zinc-400 mb-6">
        {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}
      </p>

      {view === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-base">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-left text-xs font-black uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="p-3 w-16"></th>
                <th className="p-3">Name</th>
                <th className="p-3">Kind</th>
                <th className="p-3">Role</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.slug} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="p-3">
                    <ChronicleThumb imageUrl={c.featuredImageUrl} alt="" className="w-12 h-12 shrink-0" />
                  </td>
                  <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">{c.kind}</td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">{c.role}</td>
                  <td className="p-3 text-right">
                    <Link href={`/chronicles/characters/${c.slug}`} className="text-[#02abb8] font-bold text-xs uppercase">
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
          {filtered.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/chronicles/characters/${c.slug}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/30 transition-colors"
              >
                <ChronicleThumb imageUrl={c.featuredImageUrl} alt="" className="w-14 h-14 shrink-0" />
                <div className="min-w-0 flex-1 flex items-center justify-between gap-4">
                  <Tooltip content={c.name} side="top" align="start">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{c.name}</span>
                  </Tooltip>
                  <span className="text-xs text-zinc-500 uppercase">{c.kind}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {view === 'card' && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.slug}
              href={`/chronicles/characters/${c.slug}`}
              className="group flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden hover:border-cyan-500/35 transition-all"
            >
              <ChronicleThumb imageUrl={c.featuredImageUrl} alt="" className="h-40 w-full shrink-0" />
              <div className="p-5 sm:p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#02abb8] mb-1">{c.kind}</p>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-2">
                  <Tooltip content={c.name} side="top" align="start">
                    <span className="block">{c.name}</span>
                  </Tooltip>
                </h3>
                <p className="text-base text-zinc-600 dark:text-zinc-400 line-clamp-3">{c.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
