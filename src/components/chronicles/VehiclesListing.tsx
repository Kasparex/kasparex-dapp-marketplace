'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ChronicleVehicle, VehicleKind } from '@/lib/chronicles/types';
import { FilterBar } from '@/components/FilterBar';
import { ViewModeToggle } from './ViewModeToggle';
import type { ChroniclesViewMode } from '@/lib/chronicles/types';
import { filterVehiclesByKind, searchVehicles } from '@/lib/chronicles/filtering';
import { sortVehiclesByName } from '@/lib/chronicles/sorting';

const kinds: { id: VehicleKind; label: string }[] = [
  { id: 'vehicle', label: 'Vehicles' },
  { id: 'device', label: 'Devices' },
  { id: 'tool', label: 'Tools' },
  { id: 'weapon', label: 'Weapons' },
];

export function VehiclesListing({ initial }: { initial: ChronicleVehicle[] }) {
  const [search, setSearch] = useState('');
  const [selKinds, setSelKinds] = useState<VehicleKind[]>([]);
  const [view, setView] = useState<ChroniclesViewMode>('card');

  const filtered = useMemo(() => {
    let list = sortVehiclesByName(initial);
    list = searchVehicles(list, search);
    list = filterVehiclesByKind(list, selKinds);
    return list;
  }, [initial, search, selKinds]);

  const toggle = (id: VehicleKind) => {
    setSelKinds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-8">
        <FilterBar
          search={{ value: search, onChange: setSearch, placeholder: 'Search vehicles & tech...' }}
          onReset={() => {
            setSearch('');
            setSelKinds([]);
          }}
        >
          <div className="flex flex-wrap gap-2 shrink-0">
            {kinds.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => toggle(k.id)}
                className={`h-10 px-3 rounded-lg text-xs font-bold uppercase border ${
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

      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{filtered.length} items</p>

      {view === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-xs font-black uppercase text-zinc-500">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Kind</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.slug} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="p-3 font-semibold">{v.name}</td>
                  <td className="p-3 text-zinc-600">{v.kind}</td>
                  <td className="p-3 text-right">
                    <Link href={`/chronicles/vehicles/${v.slug}`} className="text-[#02abb8] font-bold text-xs uppercase">
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
          {filtered.map((v) => (
            <li key={v.slug}>
              <Link
                href={`/chronicles/vehicles/${v.slug}`}
                className="flex justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold hover:border-cyan-500/30"
              >
                {v.name}
                <span className="text-xs font-normal text-zinc-500 uppercase">{v.kind}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {view === 'card' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <Link
              key={v.slug}
              href={`/chronicles/vehicles/${v.slug}`}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-cyan-500/35 bg-white dark:bg-zinc-900/40"
            >
              <p className="text-[10px] font-black text-[#02abb8] uppercase mb-1">{v.kind}</p>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-2">{v.name}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">{v.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
