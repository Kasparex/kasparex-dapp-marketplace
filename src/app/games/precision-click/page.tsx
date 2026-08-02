'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getGameBySlugFromRegistry } from '@/lib/games/registry';
import { PrecisionClickDashboard } from '@/components/game/precision-click/PrecisionClickDashboard';
import { GamePlayWalletGate } from '@/components/games/GamePlayWalletGate';

function PageInner() {
  const game = getGameBySlugFromRegistry('precision-click');

  if (!game) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Game not found</div>;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.12),transparent_70%)] blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.1),transparent_70%)] blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.04]" />
      </div>

      <Header />

      <main className="flex-1 relative z-10 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <div className="mb-6">
            <Link
              href="/games"
              className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors group text-base font-medium"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Games
            </Link>
          </div>

          <div className="flex-1">
            <GamePlayWalletGate game={game}>
              <PrecisionClickDashboard
                game={game}
                featuredImage={game.featuredImage ?? ''}
                gameDescription={game.description}
                gameName={game.name}
                loreStory="The Null Gang flooded the lock grid with static. Open a paid 24h ARIA Lock, clear ten cascading seals without farming the same stage twice, and refine banked Aria fragments into Hub points before the chrono dies."
              />
            </GamePlayWalletGate>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PrecisionClickPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-base">
          Loading…
        </div>
      }
    >
      <PageInner />
    </Suspense>
  );
}

