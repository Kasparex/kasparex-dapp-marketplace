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
import { AdSlider } from '@/components/ads/AdSlider';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { HubAccentScope } from '@/components/hub/HubAccentScope';
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
      <HubAccentScope projectId="kasparex-ads" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className={`mb-6 flex flex-wrap gap-3 ${HUB_HALO_MOBILE_FALLBACK}`}>
          <button
            type="button"
            onClick={() => openCreateWizard()}
            className="k-cta-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create ad
          </button>
          <Link href="/ads/overview" className="k-control-btn">
            How it works
          </Link>
        </div>
        <div
          className={`relative mb-10 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-emerald-50/40 to-rose-50/30 px-6 py-12 sm:px-8 dark:border-zinc-800/50 dark:from-zinc-950 dark:via-emerald-950/20 dark:to-rose-950/15 ${HUB_HALO_DESKTOP_ONLY}`}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute right-0 top-0 h-[80%] w-[60%] rounded-full bg-[radial-gradient(ellipse_at_top_right,_var(--hub-accent-muted),transparent_70%)] blur-3xl" />
            <div className="absolute bottom-0 left-0 h-[60%] w-[50%] rounded-full bg-[radial-gradient(ellipse_at_bottom_left,_rgba(248,113,113,0.12),transparent_70%)] blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex gap-2 rounded-full border border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 dark:text-[color:var(--hub-accent)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--hub-accent)] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--hub-accent)]" />
                </span>
                Active campaigns
              </div>
              <h1 className="mb-4 text-4xl font-black leading-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
                Kasparex{' '}
                <span className="bg-gradient-to-r from-emerald-500 to-rose-400 bg-clip-text text-transparent dark:from-emerald-300 dark:to-rose-300">
                  Ads
                </span>
              </h1>
              <p className="kx-body mb-6 max-w-xl leading-relaxed">
                Browse time-locked ad campaigns across halo, sidebar, and footer placements. Filter by format and slot.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openCreateWizard()}
                  className="k-cta-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create ad
                </button>
                <Link href="/ads/overview" className="k-control-btn">
                  How it works
                </Link>
              </div>
            </div>
            <div className="relative hidden w-[280px] flex-shrink-0 items-center justify-center lg:flex">
              <div className="pointer-events-none relative opacity-90">
                <div className="h-56 w-48 rotate-3 transform rounded-2xl border-2 border-[color:var(--hub-accent-border)] bg-white/80 shadow-2xl shadow-[color:var(--hub-accent-shadow)] dark:bg-zinc-900/80" />
                <div className="absolute -bottom-2 -right-2 h-48 w-40 -rotate-6 transform rounded-xl border-2 border-rose-400/25 bg-zinc-100/90 shadow-xl dark:bg-zinc-800/90" />
              </div>
              <div
                id="ad-slot-ads-halo"
                className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center scroll-mt-24"
              >
                <AdSlider slotId="HALO_ADS_RIGHT" />
              </div>
            </div>
          </div>
        </div>

        <div id="content" className="scroll-mt-4" />

        <HubListingTitleRow
          projectId="kasparex-ads"
          title="Active campaigns"
          count={filteredAds.length}
          countLabel="campaign"
          benefits={<HubBenefitsPanel variant="compact" scope="ads" className="w-full" />}
        />

        <div className="mb-6 flex flex-col gap-4">
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
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-zinc-600 dark:text-zinc-400">No campaigns match your filters.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 text-sm text-[color:var(--hub-accent)] hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </HubAccentScope>

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
