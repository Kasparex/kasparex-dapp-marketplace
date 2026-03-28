'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AD_SLOTS } from '@/lib/ads/slots';
import type { AdEntry, AdFormat, AdSlotId } from '@/lib/ads/types';
import { AdCard } from '@/components/ads/AdCard';
import { CreateAdWizard } from '@/components/ads/CreateAdWizard';
import { useAdsRegistryContext } from '@/components/ads/AdsRegistryProvider';
import { FilterBar } from '@/components/FilterBar';

export type AdsSortOption = 'newest' | 'ending-soon' | 'slot' | 'format';

function sortAds(ads: AdEntry[], sortBy: AdsSortOption): AdEntry[] {
  const sorted = [...ads];
  switch (sortBy) {
    case 'newest':
      sorted.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      break;
    case 'ending-soon':
      sorted.sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());
      break;
    case 'slot':
      sorted.sort((a, b) => a.slotId.localeCompare(b.slotId));
      break;
    case 'format':
      sorted.sort((a, b) => (a.format ?? 'rectangle').localeCompare(b.format ?? 'rectangle'));
      break;
    default:
      break;
  }
  return sorted;
}

export default function AdsListingPage() {
  const { ads: allActive, refresh: refreshAds } = useAdsRegistryContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<AdsSortOption>('newest');
  const [formatFilter, setFormatFilter] = useState<AdFormat | 'all'>('all');
  const [slotFilter, setSlotFilter] = useState<AdSlotId | 'all'>('all');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialSlotId, setWizardInitialSlotId] = useState<AdSlotId | undefined>(undefined);
  const searchParams = useSearchParams();

  useEffect(() => {
    const take = searchParams.get('take');
    const create = searchParams.get('create');
    const slot = searchParams.get('slot');
    const raw = take ?? slot ?? undefined;
    const validSlot = raw && AD_SLOTS.some((s) => s.id === raw) ? (raw as AdSlotId) : undefined;
    if (validSlot || create === '1') {
      setWizardInitialSlotId(validSlot);
      setWizardOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    if (sortOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortOpen]);

  const filteredAds = useMemo(() => {
    let list = allActive;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (ad) =>
          ad.title.toLowerCase().includes(q) ||
          ad.slotId.toLowerCase().includes(q) ||
          (ad.format && ad.format.toLowerCase().includes(q))
      );
    }
    if (formatFilter !== 'all') {
      list = list.filter((ad) => (ad.format ?? 'rectangle') === formatFilter);
    }
    if (slotFilter !== 'all') {
      list = list.filter((ad) => ad.slotId === slotFilter);
    }
    return sortAds(list, sortBy);
  }, [allActive, searchQuery, formatFilter, slotFilter, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFormatFilter('all');
    setSlotFilter('all');
    setSortBy('newest');
  };

  const openCreateWizard = (initialSlotId?: AdSlotId) => {
    setWizardInitialSlotId(initialSlotId);
    setWizardOpen(true);
  };

  const sortOptions: { value: AdsSortOption; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'ending-soon', label: 'Ending soon' },
    { value: 'slot', label: 'By slot' },
    { value: 'format', label: 'By format' },
  ];
  const sortLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? 'Sort by...';

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Halo header - Ads identity (aligned with dApps hero structure) */}
        <div className="relative mb-10 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/40 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/20 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.15),transparent_70%)] rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(2,171,184,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(2,171,184,0.1),transparent_70%)] rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex gap-2 px-3 py-1.5 rounded-full bg-[#02abb8]/10 border border-[#02abb8]/25 text-[#02abb8] text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#02abb8] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#02abb8]" />
              </span>
              Active campaigns
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
              Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-[#02abb8] dark:from-cyan-400 dark:to-[#02abb8]">Ads</span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed mb-6">
              Browse time-locked ad campaigns across halo, sidebar, and footer placements. Filter by format and slot.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openCreateWizard()}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-[#02abb8] hover:from-cyan-600 hover:to-[#029ca8] text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create ad
              </button>
              <Link
                href="/ads/overview"
                className="inline-flex items-center px-6 py-2.5 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-bold text-sm transition-colors"
              >
                How it works
              </Link>
            </div>
          </div>
        </div>

        {/* Page header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            Active campaigns
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {filteredAds.length} campaign{filteredAds.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* FilterBar */}
        <div className="flex flex-col gap-4 mb-6">
          <FilterBar
            search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search campaigns...' }}
            onReset={handleResetFilters}
            resetLabel="Reset filters"
          >
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1 hidden sm:inline">Format:</span>
              {(['all', 'square', 'rectangle', 'tall'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormatFilter(f)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    formatFilter === f
                      ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'tall' ? 'Tall' : f === 'square' ? 'Square' : 'Rectangle'}
                </button>
              ))}
            </div>
            <div className="relative flex-shrink-0">
              <select
                value={slotFilter}
                onChange={(e) => setSlotFilter(e.target.value as AdSlotId | 'all')}
                className="k-control-btn min-w-[140px] h-10 cursor-pointer appearance-none bg-transparent pr-8"
              >
                <option value="all">All slots</option>
                {AD_SLOTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="relative flex-shrink-0" ref={sortRef}>
              <button
                type="button"
                onClick={() => setSortOpen(!sortOpen)}
                className="k-control-btn min-w-[130px]"
              >
                <span className="truncate">{sortLabel}</span>
                <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {sortOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value);
                        setSortOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FilterBar>
        </div>

        {/* Mosaic grid */}
        {filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAds.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                onEdit={() => openCreateWizard()}
                onDelete={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <p className="text-zinc-600 dark:text-zinc-400">No campaigns match your filters.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 text-sm text-[#02abb8] hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      <CreateAdWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => void refreshAds()}
        initialSlotId={wizardInitialSlotId ?? null}
        initialSlotIndex={wizardInitialSlotIndex}
      />
    </>
  );
}
