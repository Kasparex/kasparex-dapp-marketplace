'use client';

import { listGames } from '@/lib/games/registry';

export function GamesHaloHeader() {
  const games = listGames();
  const featured = games[0];

  return (
    <section className="mb-8 grid gap-5 rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-emerald-50/70 to-zinc-50 p-5 dark:border-zinc-800 dark:from-zinc-950 dark:via-emerald-950/30 dark:to-zinc-900 sm:p-6 lg:grid-cols-[1.15fr_1fr]">
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          Games Spotlight
        </p>
        <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Kasparex Games Deck
        </h2>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Explore official and community game projects built on Kaspa. Discover metadata, status, and launch links in one place.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white/90 p-3 dark:border-zinc-700 dark:bg-zinc-900/70">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Projects</p>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{games.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white/90 p-3 dark:border-zinc-700 dark:bg-zinc-900/70">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active</p>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              {games.filter((g) => g.status === 'active' || g.status === 'beta').length}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white/90 p-3 dark:border-zinc-700 dark:bg-zinc-900/70">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-300">Live</p>
          </div>
        </div>
      </div>

      <aside className="rounded-2xl border border-zinc-200 bg-white/90 p-4 dark:border-zinc-700 dark:bg-zinc-900/70">
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Featured game</p>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
          {featured?.featuredImage ? (
            <img src={featured.featuredImage} alt={featured.name} className="h-44 w-full object-cover" />
          ) : (
            <div className="flex h-44 w-full items-center justify-center bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              No image
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-zinc-900 dark:text-zinc-100">{featured?.name ?? 'No featured game'}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{featured?.developer ?? 'Kasparex'}</p>
          </div>
          <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            {featured?.status ?? 'beta'}
          </span>
        </div>
        <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Benefits</p>
          <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">
            Players unlock points, discover new projects early, and support creators directly from listings.
          </p>
        </div>
      </aside>
    </section>
  );
}
