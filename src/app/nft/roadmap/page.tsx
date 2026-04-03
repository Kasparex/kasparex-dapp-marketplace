'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NFTSidebar } from '@/components/nft/NFTSidebar';
import { NFTHaloHeader } from '@/components/nft/NFTHaloHeader';
import { NFT_TOOLS_ROADMAP } from '@/lib/nft/nftToolsRoadmap';

function statusBadge(status: (typeof NFT_TOOLS_ROADMAP)[0]['status']) {
  if (status === 'beta') {
    return (
      <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10">
        Beta
      </span>
    );
  }
  if (status === 'in-progress') {
    return (
      <span className="text-[10px] font-black uppercase tracking-widest text-[#02abb8] px-2 py-0.5 rounded-full border border-[#02abb8]/30 bg-[#02abb8]/10">
        In progress
      </span>
    );
  }
  return (
    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-600 bg-zinc-100/80 dark:bg-zinc-800/60">
      Planned
    </span>
  );
}

export default function NftToolsRoadmapPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <div className="flex min-h-[calc(100vh-4rem)]">
          <NFTSidebar
            activeTab="collections"
            onTabChange={() => {}}
            isRoadmapPage
          />

          <main className="flex-1 min-w-0 min-h-[calc(100vh-4rem)]">
            <NFTHaloHeader
              variant="collection"
              collectionName="NFT Tools roadmap"
              collectionDescription="Upcoming modules, experiments, and ecosystem integrations for Kasparex NFT Tools. Timelines are indicative."
            />

            <section id="nft-roadmap-grid" className="py-8 sm:py-12 scroll-mt-28">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#02abb8] mb-2">Vault-style preview</p>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2">Coming soon</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl mb-10">
                  Same card rhythm as Chronicles Vault &amp; Unlocks: large tiles, clear status, and room to grow as we
                  ship.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {NFT_TOOLS_ROADMAP.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-cyan-500/30 dark:border-cyan-500/25 bg-white/95 dark:bg-zinc-900/70 overflow-hidden flex flex-col chronicles-vault-card"
                    >
                      <div className="h-28 bg-gradient-to-br from-zinc-100 via-zinc-50 to-cyan-500/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-cyan-950/35 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                          <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>NFT Tools</span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="text-base font-black text-zinc-900 dark:text-zinc-100">{item.title}</p>
                          {statusBadge(item.status)}
                        </div>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 flex-1 leading-relaxed">{item.description}</p>
                        {item.eta ? (
                          <p className="mt-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">Target: {item.eta}</p>
                        ) : null}
                        <button
                          type="button"
                          disabled
                          className="mt-4 k-control-btn opacity-60 cursor-not-allowed text-sm font-bold uppercase tracking-wide"
                        >
                          Not yet available
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </main>
        </div>
      </main>

      <Footer />
    </div>
  );
}
