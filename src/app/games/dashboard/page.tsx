'use client';

import { useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GamesSidebar } from '@/components/games/GamesSidebar';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import { getHubFlowPreset } from '@/lib/hub/hubFlowProgress';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

type GamePromoListing = {
  id: string;
  wallet: string;
  title: string;
  shortDescription: string;
  content: string;
  coverUrl: string;
  status: 'draft' | 'published';
  createdAt: string;
};

const STORAGE_KEY = 'kasparex_games_dashboard_promotions';
const BASE_FEE_KAS = 25;
const PREMIUM_MODULE_FEE_KAS = 10;
const HUB_POINTS = 50;

function readAllListings(): GamePromoListing[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as GamePromoListing[];
  } catch {
    return [];
  }
}

function readListings(wallet?: string | null): GamePromoListing[] {
  if (!wallet) return [];
  return readAllListings().filter((x) => x.wallet.toLowerCase() === wallet.toLowerCase());
}

function saveListing(listing: GamePromoListing): void {
  if (typeof window === 'undefined') return;
  const all = readAllListings();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([listing, ...all]));
}

export default function GamesDashboardPage() {
  const { state } = useKaspaWallet();
  const [tab, setTab] = useState<'overview' | 'listings' | 'create'>('overview');
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [boostEnabled, setBoostEnabled] = useState(false);
  const [listingsVersion, setListingsVersion] = useState(0);

  const listings = useMemo(() => readListings(state.address), [state.address, listingsVersion]);
  const totalKas = BASE_FEE_KAS + (boostEnabled ? PREMIUM_MODULE_FEE_KAS : 0);

  const handleSave = () => {
    if (!state.address || !title.trim() || !shortDescription.trim()) return;
    saveListing({
      id: `game-${Date.now()}`,
      wallet: state.address,
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      content: content.trim(),
      coverUrl: coverUrl.trim(),
      status: 'published',
      createdAt: new Date().toISOString(),
    });
    setTitle('');
    setShortDescription('');
    setContent('');
    setCoverUrl('');
    setBoostEnabled(false);
    setListingsVersion((v) => v + 1);
    setTab('listings');
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex flex-1 flex-col lg:flex-row">
        <div className="hidden lg:block">
          <GamesSidebar
            selectedGameTypes={[]}
            onGameTypeChange={() => {}}
            selectedDifficulties={[]}
            onDifficultyChange={() => {}}
            selectedStatuses={[]}
            onStatusChange={() => {}}
            gameTypeCounts={{ puzzle: 0, arcade: 0, strategy: 0, casual: 0, multiplayer: 0, trivia: 0, skill: 0 }}
            difficultyCounts={{ easy: 0, medium: 0, hard: 0, expert: 0 }}
            statusCounts={{ beta: 0, active: 0, 'coming-soon': 0, maintenance: 0 }}
            searchQuery=""
            onSearchChange={() => {}}
            onResetFilters={() => {}}
            showCategories={false}
            backLink={{ href: '/hub', label: 'Back to Hub' }}
          />
        </div>

        <section className="flex-1 p-4 sm:p-6 lg:p-10">
          <div className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Games dashboard</p>
            <h1 className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">Kasparex Games Creator Center</h1>
            {state.address ? <p className="mt-2 text-xs font-mono text-zinc-500">{state.address}</p> : null}
          </div>

          <div className="mb-6 flex w-fit items-center gap-1 rounded-2xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {(['overview', 'listings', 'create'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`k-tab-btn rounded-xl ${tab === item ? 'k-tab-btn-active' : ''}`}
              >
                {item === 'overview' ? 'Overview' : item === 'listings' ? 'My Listings' : 'List Project'}
              </button>
            ))}
          </div>

          {tab === 'overview' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Published promotions</p>
                <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">{listings.length}</p>
              </div>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/25">
                <p className="text-xs font-black uppercase tracking-widest text-cyan-700 dark:text-cyan-300">Hub points</p>
                <p className="mt-2 text-3xl font-black text-cyan-900 dark:text-cyan-100">+{HUB_POINTS} pts</p>
              </div>
            </div>
          ) : null}

          {tab === 'listings' ? (
            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">My game promotions</h2>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {listings.length === 0 ? (
                  <p className="p-8 text-sm text-zinc-500">
                    No listings yet. Open the List Project tab to add your first promotion.
                  </p>
                ) : (
                  listings.map((item) => (
                    <div key={item.id} className="p-5">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                      <p className="mt-1 text-sm text-zinc-500">{item.shortDescription}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {tab === 'create' ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
              <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <DAppSectionHeader title="Main content" />
                <div>
                  <KxFormFieldLabel required>Project title</KxFormFieldLabel>
                  <input className="k-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <KxFormFieldLabel required>Short description</KxFormFieldLabel>
                  <textarea className="k-textarea min-h-[90px]" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
                </div>
                <div>
                  <KxFormFieldLabel>Cover image URL</KxFormFieldLabel>
                  <input className="k-input" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <KxFormFieldLabel>Details (rich text)</KxFormFieldLabel>
                  <KxRichTextEditor value={content} onChange={setContent} minRows={10} />
                </div>

                <div className="rounded-2xl border-2 border-dashed border-amber-400/60 bg-gradient-to-b from-amber-50/70 to-white p-5 dark:border-amber-300/40 dark:from-amber-500/[0.08] dark:to-zinc-900">
                  <KxInFormPremiumRow
                    flat
                    accent="hub"
                    title="Featured placement module"
                    description="Boost placement in upcoming Games spotlight sections."
                    priceLabel={`+${PREMIUM_MODULE_FEE_KAS} KAS`}
                    checked={boostEnabled}
                    onToggle={() => setBoostEnabled((v) => !v)}
                  />
                  {boostEnabled ? (
                    <div className="mt-4 border-t border-zinc-200 pt-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                      Featured module is active. Boost settings are applied inside this container to match the vBlog premium module behavior.
                    </div>
                  ) : null}
                </div>
              </div>

              <aside className="space-y-4 xl:sticky xl:top-6">
                <div className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-5 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/80">
                  <DAppSectionHeader title="Calculation breakdown" className="mb-0" />
                  <div className="mt-3 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex justify-between"><span>Base fee</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{BASE_FEE_KAS} KAS</span></div>
                    <div className="flex justify-between"><span>Premium modules</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{boostEnabled ? PREMIUM_MODULE_FEE_KAS : 0} KAS</span></div>
                  </div>
                  <div className="mt-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
                    <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
                    <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{totalKas} KAS</p>
                  </div>
                  <button type="button" onClick={handleSave} className="mt-4 w-full k-control-btn hub-cta-btn">
                    Publish Game Promotion
                  </button>
                </div>

                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/25">
                  <h3 className="text-sm font-black uppercase tracking-widest text-cyan-900 dark:text-cyan-100">Hub points</h3>
                  <p className="mt-2 text-2xl font-black text-cyan-900 dark:text-cyan-100">+{HUB_POINTS} pts</p>
                  <p className="mt-1 text-xs text-cyan-800/90 dark:text-cyan-300/80">Redeemable points are awarded when you publish a new promotion listing.</p>
                </div>

                <HubFlowProgress steps={getHubFlowPreset('hubPublish')} busy={false} />
              </aside>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}
