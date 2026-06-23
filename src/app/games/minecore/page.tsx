'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getGameBySlugFromRegistry } from '@/lib/games/registry';
import { GamePlayWalletGate } from '@/components/games/GamePlayWalletGate';

const MinecoreDashboard = dynamic(
  () => import('@/components/game/minecore/MinecoreDashboard').then((m) => ({ default: m.MinecoreDashboard })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">Loading Minecore…</div>
    ),
  }
);

function MinecoreContent() {
  const game = getGameBySlugFromRegistry('minecore');

  if (!game) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Game not found</div>;

  const featuredImage = game.featuredImage ?? '';

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute right-0 top-0 h-[50%] w-[50%] bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.12),transparent_70%)] blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[50%] w-[50%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.1),transparent_70%)] blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.04]" />
      </div>

      <Header />

      <main className="relative z-10 flex-1 p-4 lg:p-8">
        <div className="mx-auto flex h-full w-full min-w-0 max-w-7xl flex-col">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/games"
              className="group inline-flex items-center gap-2 text-base font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              <svg className="h-5 w-5 transform transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Games
            </Link>
            <div className="ml-auto flex flex-wrap items-center gap-4">
              <Link
                href="/games/minecore/calculator"
                className="text-base font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Calculator
              </Link>
              <Link
                href="/rewards"
                className="text-base font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Rewards
              </Link>
            </div>
          </div>

          <GamePlayWalletGate game={game}>
            <div className="space-y-6">
              <MinecoreDashboard featuredImage={featuredImage} gameDescription={game.description} game={game} gameName={game.name} />
            </div>
          </GamePlayWalletGate>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function MinecorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-base text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">Loading…</div>
      }
    >
      <MinecoreContent />
    </Suspense>
  );
}
