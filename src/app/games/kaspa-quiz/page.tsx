 'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getGameBySlugFromRegistry } from '@/lib/games/registry';
import { KrexMysteryQuizDashboard } from '@/components/game/kaspa-quiz/KrexMysteryQuizDashboard';

const KaspaL1WalletButton = dynamic(
  () => import('@/components/KaspaL1WalletButton').then((mod) => ({ default: mod.KaspaL1WalletButton })),
  { ssr: false }
);

function PageInner() {
  const { state } = useKaspaWallet();
  const game = getGameBySlugFromRegistry('kaspa-quiz');

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
            {!state.isConnected ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
                  <svg className="w-16 h-16 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-zinc-100">{game.name}</h1>
                <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto text-base">{game.description}</p>
                <div className="[&_button]:h-14 [&_button]:px-8 [&_button]:text-base">
                  <KaspaL1WalletButton />
                </div>
              </div>
            ) : (
              <KrexMysteryQuizDashboard
                game={game}
                featuredImage={game.featuredImage ?? ''}
                gameDescription={game.description}
                gameName={game.name}
                loreStory="Krex’s Chronicles are full of hidden signals, fragments, and vault keys. Clear each level to prove you can read the city like code."
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function KrexChroniclesQuizPage() {
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

