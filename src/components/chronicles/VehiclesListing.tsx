'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ChronicleVehicle, VehicleKind } from '@/lib/chronicles/types';
import { FilterBar } from '@/components/FilterBar';
import { ChroniclesViewSwitcher } from './ChroniclesViewSwitcher';
import type { ChroniclesViewMode } from '@/lib/chronicles/types';
import { filterVehiclesByKind, searchVehicles } from '@/lib/chronicles/filtering';
import { sortVehiclesByName } from '@/lib/chronicles/sorting';
import { ChronicleThumb } from './ChronicleFeaturedVisual';
import { ChroniclesFilterDropdown } from './ChroniclesFilterDropdown';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

const kinds: { id: VehicleKind; label: string }[] = [
  { id: 'vehicle', label: 'Vehicles' },
  { id: 'device', label: 'Devices' },
  { id: 'tool', label: 'Tools' },
  { id: 'weapon', label: 'Weapons' },
];

export function VehiclesListing({ initial }: { initial: ChronicleVehicle[] }) {
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<VehicleKind | ''>('');
  const [view, setView] = useState<ChroniclesViewMode>('card');

  const filtered = useMemo(() => {
    let list = sortVehiclesByName(initial);
    list = searchVehicles(list, search);
    list = filterVehiclesByKind(list, kindFilter ? [kindFilter] : []);
    return list;
  }, [initial, search, kindFilter]);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-10">
        <FilterBar
          flexWrap
          search={{ value: search, onChange: setSearch, placeholder: 'Search vehicles & tech...' }}
          onReset={() => {
            setSearch('');
            setKindFilter('');
          }}
        >
          <ChroniclesFilterDropdown
            ariaLabel="Filter by kind"
            value={kindFilter}
            onChange={(v) => setKindFilter(v as VehicleKind | '')}
            allLabel="All kinds"
            options={kinds.map((k) => ({ value: k.id, label: k.label }))}
          />
          <ChroniclesViewSwitcher value={view} onChange={setView} />
        </FilterBar>
      </div>

      <p className="text-base text-zinc-500 dark:text-zinc-400 mb-6">{filtered.length} items</p>

      {view === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-base">
            <thead className="bg-zinc-50 dark:bg-zinc-900/90 text-xs font-black uppercase text-zinc-500">
              <tr>
                <th className="p-3 text-left w-16"></th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Kind</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.slug} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="p-3">
                    <ChronicleThumb imageUrl={v.featuredImageUrl} alt="" className="w-12 h-12 shrink-0" />
                  </td>
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
        <ul className="space-y-3">
          {filtered.map((v) => (
            <li key={v.slug}>
              <Link
                href={`/chronicles/vehicles/${v.slug}`}
                className="flex items-center gap-4 justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold hover:border-cyan-500/30"
              >
                <span className="flex items-center gap-4 min-w-0">
                  <ChronicleThumb imageUrl={v.featuredImageUrl} alt="" className="w-14 h-14 shrink-0" />
                  <Tooltip content={gameTooltipRich('Vehicle', v.name)} side="top" align="start">
                    <span className="truncate">{v.name}</span>
                  </Tooltip>
                </span>
                <span className="text-xs font-normal text-zinc-500 uppercase shrink-0">{v.kind}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {view === 'card' && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <Link
              key={v.slug}
              href={`/chronicles/vehicles/${v.slug}`}
              className="group flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden hover:border-cyan-500/35"
            >
              <ChronicleThumb imageUrl={v.featuredImageUrl} alt="" className="h-40 w-full shrink-0" />
              <div className="p-5 sm:p-6">
                <p className="text-[10px] font-black text-[#02abb8] uppercase mb-1">{v.kind}</p>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-2">
                  <Tooltip content={gameTooltipRich('Vehicle', v.name)} side="top" align="start">
                    <span className="block">{v.name}</span>
                  </Tooltip>
                </h3>
                <p className="text-base text-zinc-600 dark:text-zinc-400 line-clamp-3">{v.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
