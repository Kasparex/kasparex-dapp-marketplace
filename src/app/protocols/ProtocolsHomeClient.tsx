'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FilterBar } from '@/components/FilterBar';
import { AdSlider } from '@/components/ads/AdSlider';
import { ProtocolHubCard } from '@/components/protocols/ProtocolHubCard';
import { ProtocolsSidebar } from '@/components/protocols/ProtocolsSidebar';
import {
  PROTOCOL_HUB_ITEMS,
  countByBucket,
  filterProtocolHubItems,
  parseKindsParam,
  type ProtocolHubBucket,
  type ProtocolHubItem,
} from '@/lib/protocolsHub';

type ViewMode = 'cards' | 'table' | 'compact';
type SortMode = 'featured' | 'az' | 'za';

function sortItems(items: ProtocolHubItem[], sort: SortMode): ProtocolHubItem[] {
  const copy = [...items];
  if (sort === 'az') copy.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'za') copy.sort((a, b) => b.title.localeCompare(a.title));
  if (sort === 'featured') {
    const rank = (m: ProtocolHubItem['maturity']) => (m === 'stable' ? 0 : m === 'beta' ? 1 : 2);
    copy.sort((a, b) => rank(a.maturity) - rank(b.maturity) || a.title.localeCompare(b.title));
  }
  return copy;
}

function ViewToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
}) {
  return (
    <div className="k-control-group shrink-0">
      <button
        type="button"
        onClick={() => onViewModeChange('cards')}
        className={`p-2.5 transition-colors ${viewMode === 'cards' ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8]' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
        title="Card view"
        aria-label="Card view"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('table')}
        className={`border-l border-zinc-200 p-2.5 transition-colors dark:border-zinc-800 ${viewMode === 'table' ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8]' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
        title="Table view"
        aria-label="Table view"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('compact')}
        className={`border-l border-zinc-200 p-2.5 transition-colors dark:border-zinc-800 ${viewMode === 'compact' ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8]' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
        title="Compact view"
        aria-label="Compact view"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}

function SortSelect({ value, onChange }: { value: SortMode; onChange: (v: SortMode) => void }) {
  return (
    <select
      className="k-filter-select h-10 min-w-[10rem] shrink-0"
      value={value}
      onChange={(e) => onChange(e.target.value as SortMode)}
      aria-label="Sort listing"
    >
      <option value="featured">Featured (maturity)</option>
      <option value="az">Title A–Z</option>
      <option value="za">Title Z–A</option>
    </select>
  );
}

export function ProtocolsHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuckets, setSelectedBuckets] = useState<ProtocolHubBucket[]>([]);
  const [suite, setSuite] = useState<'all' | 'kpx'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortMode, setSortMode] = useState<SortMode>('featured');

  const kindQuery = searchParams.get('kind');
  useEffect(() => {
    setSelectedBuckets(parseKindsParam(kindQuery) ?? []);
  }, [kindQuery]);

  const bucketCounts = useMemo(() => countByBucket(PROTOCOL_HUB_ITEMS), []);

  const filtered = useMemo(() => {
    const buckets = selectedBuckets.length > 0 ? selectedBuckets : null;
    return filterProtocolHubItems(PROTOCOL_HUB_ITEMS, {
      search: searchQuery,
      buckets,
      suite,
    });
  }, [searchQuery, selectedBuckets, suite]);

  const sorted = useMemo(() => sortItems(filtered, sortMode), [filtered, sortMode]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedBuckets([]);
    setSuite('all');
    setSortMode('featured');
    setViewMode('cards');
    router.replace('/protocols', { scroll: false });
  };

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col lg:flex-row">
        <div className="hidden shrink-0 lg:block">
          <ProtocolsSidebar
            selectedBuckets={selectedBuckets}
            onBucketsChange={(next) => {
              setSelectedBuckets(next);
              const q = next.length ? `?kind=${next.join(',')}` : '';
              router.replace(`/protocols${q}`, { scroll: false });
            }}
            suite={suite}
            onSuiteChange={setSuite}
            counts={bucketCounts}
            onResetFilters={handleReset}
          />
        </div>
        <div className="lg:hidden">
          <ProtocolsSidebar
            selectedBuckets={selectedBuckets}
            onBucketsChange={(next) => {
              setSelectedBuckets(next);
              const q = next.length ? `?kind=${next.join(',')}` : '';
              router.replace(`/protocols${q}`, { scroll: false });
            }}
            suite={suite}
            onSuiteChange={setSuite}
            counts={bucketCounts}
            onResetFilters={handleReset}
          />
        </div>

        <div className="relative min-w-0 flex-1 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="mx-auto max-w-7xl">
            <div className="relative mb-10 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 px-6 py-12 sm:px-8 dark:border-zinc-800/50 dark:from-zinc-950 dark:via-cyan-950/25 dark:to-zinc-950">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute right-0 top-0 h-[80%] w-[60%] rounded-full bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.12),transparent_70%)] blur-3xl dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.16),transparent_70%)]" />
                <div className="absolute bottom-0 left-0 h-[60%] w-[50%] rounded-full bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.09),transparent_70%)] blur-3xl dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.12),transparent_70%)]" />
                <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl" />
              </div>
              <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-800 dark:text-cyan-200">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                    </span>
                    Open standards
                  </div>
                  <h1 className="mb-4 text-4xl font-black leading-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
                    Kasparex{' '}
                    <span className="bg-gradient-to-r from-cyan-700 via-cyan-600 to-teal-600 bg-clip-text text-transparent dark:from-cyan-300 dark:via-cyan-300 dark:to-teal-300">
                      Protocols
                    </span>
                  </h1>
                  <p className="mb-8 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
                    Specifications, tools, documentation, and reference implementations for identity, publishing, and
                    cross-chain workflows on Kaspa — aligned with how Kasparex indexes and surfaces data across the Hub.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href="#hub-content"
                      className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-700 hover:to-teal-700"
                    >
                      Browse catalog
                    </a>
                    <a
                      href="/protocols/kpx-tools"
                      className="rounded-xl border border-zinc-300 px-6 py-2.5 text-sm font-bold text-zinc-800 transition-colors hover:border-[#02abb8]/50 hover:text-[#02abb8] dark:border-zinc-600 dark:text-zinc-100 dark:hover:border-[#02abb8]/40"
                    >
                      Post an update
                    </a>
                  </div>
                </div>
                <div className="relative hidden w-[280px] shrink-0 items-center justify-center lg:flex">
                  <div className="pointer-events-none relative opacity-90">
                    <div className="h-56 w-48 rotate-3 transform rounded-2xl border-2 border-cyan-500/30 bg-white/80 shadow-2xl shadow-cyan-500/10 dark:bg-zinc-900/80" />
                    <div className="absolute -bottom-2 -right-2 h-48 w-40 -rotate-6 transform rounded-xl border-2 border-teal-500/20 bg-zinc-100/90 shadow-xl dark:bg-zinc-800/90" />
                    <div className="absolute bottom-4 left-4 right-4 top-4 flex items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700/50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">kpx · hub</span>
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

            <div id="hub-content" className="scroll-mt-4" />

            <div className="mb-6">
              <h2 className="mb-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Catalog</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {sorted.length} entr{sorted.length === 1 ? 'y' : 'ies'} {suite === 'kpx' ? 'in the kpx suite' : 'across suites'}
              </p>
            </div>

            <div className="mb-6 flex flex-col gap-4">
              <FilterBar
                flexWrap
                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search protocols, tools, docs…' }}
                onReset={handleReset}
              >
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                <SortSelect value={sortMode} onChange={setSortMode} />
              </FilterBar>
            </div>

            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sorted.map((item) => (
                  <ProtocolHubCard key={item.id} item={item} />
                ))}
              </div>
            ) : viewMode === 'compact' ? (
              <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                {sorted.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.title}</span>
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{item.subtitle ?? item.description}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-black uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Suite</th>
                      <th className="px-4 py-3">Maturity</th>
                      <th className="px-4 py-3">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {sorted.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{item.bucket}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{item.suite}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{item.maturity}</td>
                        <td className="px-4 py-3">
                          <a href={item.href} className="font-bold text-[#02abb8] hover:underline">
                            Open
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <section id="use-cases" className="mt-14 scroll-mt-24 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6 dark:border-zinc-800 dark:bg-zinc-950/40">
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Featured workflows</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Same building blocks as the catalog above — grouped here for product and integration discussions.
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                <li>Ship a public profile and optional verified signal alongside your creator presence.</li>
                <li>Link Kaspa payouts to an EVM treasury or bridge flow without custodial username databases.</li>
                <li>Publish content fingerprints so mirrors, NFT metadata, and apps can agree on canonical bytes.</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
