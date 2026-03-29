'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CharacterKind, ChronicleCharacter } from '@/lib/chronicles/types';
import { FilterBar } from '@/components/FilterBar';
import { ViewModeToggle } from './ViewModeToggle';
import type { ChroniclesViewMode } from '@/lib/chronicles/types';
import { filterCharactersByKind, searchCharacters } from '@/lib/chronicles/filtering';
import { sortCharactersByName } from '@/lib/chronicles/sorting';

const kinds: { id: CharacterKind; label: string }[] = [
  { id: 'person', label: 'People' },
  { id: 'ai', label: 'AI' },
  { id: 'faction', label: 'Factions' },
  { id: 'organization', label: 'Organizations' },
  { id: 'unknown', label: 'Unknown' },
];

export function CharactersListing({ initial }: { initial: ChronicleCharacter[] }) {
  const [search, setSearch] = useState('');
  const [selKinds, setSelKinds] = useState<CharacterKind[]>([]);
  const [view, setView] = useState<ChroniclesViewMode>('card');

  const filtered = useMemo(() => {
    let list = sortCharactersByName(initial);
    list = searchCharacters(list, search);
    list = filterCharactersByKind(list, selKinds);
    return list;
  }, [initial, search, selKinds]);

  const toggle = (id: CharacterKind) => {
    setSelKinds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-8">
        <FilterBar
          search={{ value: search, onChange: setSearch, placeholder: 'Search characters...' }}
          onReset={() => {
            setSearch('');
            setSelKinds([]);
          }}
        >
          <div className="flex flex-wrap gap-2 items-center shrink-0">
            {kinds.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => toggle(k.id)}
                className={`h-10 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
                  selKinds.includes(k.id)
                    ? 'border-[#02abb8] bg-[#02abb8]/10 text-[#02abb8]'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <ViewModeToggle value={view} onChange={setView} />
        </FilterBar>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}
      </p>

      {view === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-left text-xs font-black uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Kind</th>
                <th className="p-3">Role</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.slug} className="border-t border-zinc-200 dark:border-zinc-800">
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
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/chronicles/characters/${c.slug}`}
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/30 transition-colors"
              >
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{c.name}</span>
                <span className="text-xs text-zinc-500 uppercase">{c.kind}</span>
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
              href={`/chronicles/characters/${c.slug}`}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-cyan-500/35 transition-all bg-white dark:bg-zinc-900/40"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-[#02abb8] mb-1">{c.kind}</p>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-2">{c.name}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">{c.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
