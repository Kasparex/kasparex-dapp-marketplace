'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdSlider } from '@/components/ads/AdSlider';
import { ProtocolFamilyCard } from '@/components/protocols/ProtocolFamilyCard';
import { ProtocolsIndexSidebar } from '@/components/protocols/ProtocolsIndexSidebar';
import { FilterBar } from '@/components/FilterBar';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { HubPageAccentLayout } from '@/components/hub/HubPageAccentLayout';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { HUB_HALO_DESKTOP_ONLY, HUB_HALO_MOBILE_FALLBACK } from '@/lib/hub/haloHeaders';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';
import { PROTOCOL_FAMILIES, type ProtocolFamily, type ProtocolFamilyStatus } from '@/lib/protocolFamilies';

type ProtocolStatusFilter = 'all' | ProtocolFamilyStatus;
type ProtocolSortOption = 'default' | 'alphabetical-az' | 'alphabetical-za' | 'status';

const STATUS_TABS = [
  { value: 'all' as const, label: 'All', title: 'All protocol families' },
  { value: 'live' as const, label: 'Live', title: 'Live protocols' },
  { value: 'preview' as const, label: 'Preview', title: 'Preview protocols' },
  { value: 'planned' as const, label: 'Planned', title: 'Planned protocols' },
];

const SORT_OPTIONS = [
  { value: 'default' as const, label: 'Default order' },
  { value: 'alphabetical-az' as const, label: 'Alphabetical (A-Z)' },
  { value: 'alphabetical-za' as const, label: 'Alphabetical (Z-A)' },
  { value: 'status' as const, label: 'By status' },
];

function filterAndSortFamilies(
  families: ProtocolFamily[],
  statusFilter: ProtocolStatusFilter,
  searchQuery: string,
  sortBy: ProtocolSortOption,
): ProtocolFamily[] {
  let list = [...families];
  if (statusFilter !== 'all') {
    list = list.filter((f) => f.status === statusFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.shortLabel.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q),
    );
  }
  switch (sortBy) {
    case 'alphabetical-az':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'alphabetical-za':
      list.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'status': {
      const order: Record<ProtocolFamilyStatus, number> = { live: 0, preview: 1, planned: 2 };
      list.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
      break;
    }
    default:
      break;
  }
  return list;
}

export function ProtocolsHomeContent() {
  const [statusFilter, setStatusFilter] = useState<ProtocolStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ProtocolSortOption>('default');

  const filteredFamilies = useMemo(
    () => filterAndSortFamilies(PROTOCOL_FAMILIES, statusFilter, searchQuery, sortBy),
    [statusFilter, searchQuery, sortBy],
  );

  const handleResetFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setSortBy('default');
  };

  return (
    <>
      <Header />
      <main className={`flex min-h-[calc(100vh-4rem)] flex-1 flex-col lg:flex-row ${HUB_PAGE_BG}`}>
        <HubPageAccentLayout projectId="kasparex-protocols">
        <ProtocolsIndexSidebar />

        <div className={HUB_MAIN_COLUMN}>
          <div className={HUB_MAIN_INNER}>
            <div className={`mb-6 flex flex-wrap gap-4 ${HUB_HALO_MOBILE_FALLBACK}`}>
              <KxTabStrip
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_TABS.map((t) => ({ value: t.value, label: t.label, title: t.title }))}
                ariaLabel="Protocol status"
                scrollable
              />
            </div>
            <div className={`relative mb-10 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-indigo-50/50 to-amber-50/40 px-6 py-12 sm:px-8 dark:border-zinc-800/50 dark:from-zinc-950 dark:via-indigo-950/25 dark:to-zinc-950 ${HUB_HALO_DESKTOP_ONLY}`}>
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute right-0 top-0 h-[80%] w-[60%] rounded-full bg-[radial-gradient(ellipse_at_top_right,_rgba(129,140,248,0.14),transparent_70%)] blur-3xl dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(129,140,248,0.18),transparent_70%)]" />
                <div className="absolute bottom-0 left-0 h-[60%] w-[50%] rounded-full bg-[radial-gradient(ellipse_at_bottom_left,_rgba(250,204,21,0.1),transparent_70%)] blur-3xl dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(250,204,21,0.12),transparent_70%)]" />
                <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--hub-accent-muted)] blur-3xl" />
              </div>
              <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900 dark:text-[color:var(--hub-accent-light)]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--hub-accent-light)] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--hub-accent)]" />
                    </span>
                    Open standards
                  </div>
                  <h1 className="mb-4 text-4xl font-black leading-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
                    Kasparex{' '}
                    <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-400 bg-clip-text text-transparent dark:from-indigo-300 dark:via-indigo-300 dark:to-amber-300">
                      Protocols
                    </span>
                  </h1>
                  <p className="kx-body mb-8 max-w-xl leading-relaxed">
                    Pick a protocol family to open its hub: tools you can run today, HTTP APIs, use cases, and docs - starting with{' '}
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">kpx</span> on Kaspa.
                  </p>
                  <KxTabStrip
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={STATUS_TABS.map((t) => ({ value: t.value, label: t.label, title: t.title }))}
                    ariaLabel="Protocol status"
                    scrollable
                  />
                </div>
                <div className="relative hidden w-[280px] shrink-0 items-center justify-center lg:flex">
                  <div className="pointer-events-none relative opacity-90">
                    <div className="h-56 w-48 rotate-3 transform rounded-2xl border-2 border-[color:var(--hub-accent-border)] bg-white/80 shadow-2xl shadow-[color:var(--hub-accent-shadow)] dark:bg-zinc-900/80" />
                    <div className="absolute -bottom-2 -right-2 h-48 w-40 -rotate-6 transform rounded-xl border-2 border-amber-400/25 bg-zinc-100/90 shadow-xl dark:bg-zinc-800/90" />
                    <div className="absolute bottom-4 left-4 right-4 top-4 flex items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700/50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">kpx · ktree · kref</span>
                    </div>
                  </div>
                  <div
                    id="ad-slot-protocols-halo"
                    className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center scroll-mt-24"
                  >
                    <AdSlider slotId="HALO_PROTOCOLS_RIGHT" />
                  </div>
                </div>
              </div>
            </div>

            <div id="protocol-families" className="scroll-mt-24" />

            <HubListingTitleRow
              projectId="kasparex-protocols"
              title="Available protocol families"
              count={filteredFamilies.length}
              countLabel="family"
              benefits={<HubBenefitsPanel variant="compact" scope="protocols" className="w-full" />}
            />

            <div className="mb-6 flex flex-col gap-4">
              <FilterBar
                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search protocols...' }}
                onReset={handleResetFilters}
                flexWrap
              >
                <KxFilterDropdown
                  value={sortBy}
                  onChange={setSortBy}
                  options={SORT_OPTIONS}
                  ariaLabel="Sort protocol families"
                />
              </FilterBar>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFamilies.map((family) => (
                <ProtocolFamilyCard key={family.slug} family={family} />
              ))}
            </div>

            {filteredFamilies.length === 0 ? (
              <p className="py-12 text-center kx-body">No protocol families match your filters.</p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/protocols/kpx#tools"
                className="k-control-btn !border-[color:var(--hub-accent-border)] !bg-[color:var(--hub-accent-muted)] !text-[color:var(--hub-accent)]"
              >
                KPX tools
              </Link>
            </div>
          </div>
        </div>
        </HubPageAccentLayout>
      </main>
      <Footer />
    </>
  );
}
