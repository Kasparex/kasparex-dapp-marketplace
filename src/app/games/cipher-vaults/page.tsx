'use client';

import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getGameBySlugFromRegistry } from '@/lib/games/registry';
import Link from 'next/link';
import { CipherVaultsDashboard } from '@/components/game/cipher-vaults/CipherVaultsDashboard';
import { GamePlayWalletGate } from '@/components/games/GamePlayWalletGate';

const LORE_STORY = `Krex sealed Cipher Vaults across Kaspaland: covenant chambers that hold scrambled fragments of ARIA’s early memory.

Each vault is a timed seal. Pay the entry, open the covenant, and reconstruct the rune grid before the countdown collapses the chamber. The Null Gang tried to weaponize these fragments; their interference only made the ciphers harder and the seals hungrier.

Clear a vault and you bank Cipher Fragments. Refine them into Hub redeem points. Higher covenants cost more, scramble deeper, and pay more when you prove the key.`;

function CipherVaultsContent() {
  const game = getGameBySlugFromRegistry('cipher-vaults');

  if (!game) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Game not found</div>;

  const featuredImage = game.featuredImage ?? '';

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
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
              <div className="space-y-6">
                <CipherVaultsDashboard featuredImage={featuredImage} loreStory={LORE_STORY} gameDescription={game.description} game={game} gameName={game.name} />
              </div>
            </GamePlayWalletGate>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CipherVaultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-base">
          Loading…
        </div>
      }
    >
      <CipherVaultsContent />
    </Suspense>
  );
}

