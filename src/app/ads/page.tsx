'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AD_SLOTS } from '@/lib/ads/slots';
import type { AdEntry, AdFormat, AdSlotId } from '@/lib/ads/types';
import { AdCard } from '@/components/ads/AdCard';
import { CreateAdWizard } from '@/components/ads/CreateAdWizard';
import { useAdsRegistryContext } from '@/components/ads/AdsRegistryProvider';
import { FilterBar } from '@/components/FilterBar';
import {
  AdsListingFilterControls,
  type AdsSortOption,
} from '@/components/ads/AdsListingFilterControls';
import { HUB_HALO_DESKTOP_ONLY, HUB_HALO_MOBILE_FALLBACK } from '@/lib/hub/haloHeaders';

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

function AdsListingPageContent() {
  const { ads: allActive, refresh: refreshAds } = useAdsRegistryContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<AdsSortOption>('newest');
  const [formatFilter, setFormatFilter] = useState<AdFormat | 'all'>('all');
  const [slotFilter, setSlotFilter] = useState<AdSlotId | 'all'>('all');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialSlotId, setWizardInitialSlotId] = useState<AdSlotId | undefined>(undefined);
  const [wizardInitialSlotIndex, setWizardInitialSlotIndex] = useState(0);
  const searchParams = useSearchParams();

  useEffect(() => {
    const take = searchParams.get('take');
    const create = searchParams.get('create');
    const slot = searchParams.get('slot');
    const raw = take ?? slot ?? undefined;
    const validSlot = raw && AD_SLOTS.some((s) => s.id === raw) ? (raw as AdSlotId) : undefined;
    const idxRaw = searchParams.get('cell');
    const idxParsed = idxRaw != null ? parseInt(idxRaw, 10) : 0;
    const cellIdx = Number.isNaN(idxParsed) ? 0 : Math.max(0, idxParsed);
    if (validSlot || create === '1') {
      setWizardInitialSlotId(validSlot);
      setWizardInitialSlotIndex(cellIdx);
      setWizardOpen(true);
    }
  }, [searchParams]);

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

  const openCreateWizard = (initialSlotId?: AdSlotId, initialSlotIndex = 0) => {
    setWizardInitialSlotId(initialSlotId);
    setWizardInitialSlotIndex(initialSlotIndex);
    setWizardOpen(true);
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className={`mb-6 flex flex-wrap gap-3 ${HUB_HALO_MOBILE_FALLBACK}`}>
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
        <div className={`relative mb-10 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/40 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/20 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/50 ${HUB_HALO_DESKTOP_ONLY}`}>
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
            <p className="kx-body max-w-xl leading-relaxed mb-6">
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

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            Active campaigns
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {filteredAds.length} campaign{filteredAds.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <FilterBar
            search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search campaigns...' }}
            onReset={handleResetFilters}
            resetLabel="Reset filters"
          >
            <AdsListingFilterControls
              formatFilter={formatFilter}
              onFormatChange={setFormatFilter}
              slotFilter={slotFilter}
              onSlotChange={setSlotFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </FilterBar>
        </div>

        {filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} onEdit={() => openCreateWizard()} />
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
        onSuccess={() => void refreshAds({ silent: true })}
        initialSlotId={wizardInitialSlotId ?? null}
        initialSlotIndex={wizardInitialSlotIndex}
      />
    </>
  );
}

export default function AdsListingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading ads…</div>}>
      <AdsListingPageContent />
    </Suspense>
  );
}
