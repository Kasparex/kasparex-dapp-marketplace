'use client';

import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MiningDashboard } from '@/components/game/MiningDashboard';
import { getGameBySlugFromRegistry } from '@/lib/games/registry';
import Link from 'next/link';
import { GamePlayWalletGate } from '@/components/games/GamePlayWalletGate';

const LORE_STORY = `Deep beneath the neon city of Kaspaland, hidden far below the surface, lies an ancient network of glowing crystal veins.

THE DISCOVERY
For centuries these crystals remained undiscovered, quietly forming within the underground layers of the metropolis. Their origin remained a mystery until Krex, the cryptography mastermind and founder of Kasparex, detected unusual energy patterns coming from deep underground.

KREX DIAMONDS
After months of analysis, Krex discovered that these crystals were not ordinary minerals. They were formed from BlockDAG energy flows traveling through the Kaspa network itself. These rare crystals became known as Krex Diamonds.

IDLE EXTRACTION
Each diamond contains condensed fragments of network energy. In Diamond Veins, trusted operators deploy Kasparex NFTs into Worker, Operator, and Foreman slots. While a slot still has session energy, it idle-mines Diamonds that can be refined into Hub points. Shop consumables restore energy; boosts extend sessions and raise live flow.

YOUR ROLE
By deploying PIXELKREX and KREXPRIME units, including Diamond and Rarest tiers, you help Krex explore deeper sections of the underground network. Session bonuses from Premium collections and NFT tiers keep crews mining longer between feeds.

THE DEPTHS
The deeper the mining operations go, the more mysterious the diamond veins become. Some miners whisper about rare crystal chambers and ancient veins that glow with unimaginable power. No one knows how deep the diamond network truly goes.

The Diamond Veins of Kaspaland are only beginning to reveal their secrets.`;

function DiamondVeinsContent() {
  const game = getGameBySlugFromRegistry('diamond-veins');

  if (!game) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Game not found</div>;

  const featuredImage = game.featuredImage ?? '';

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Background - theme aware */}
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
                <MiningDashboard featuredImage={featuredImage} loreStory={LORE_STORY} gameDescription={game.description} game={game} gameName={game.name} />
              </div>
            </GamePlayWalletGate>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function DiamondVeinsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-base">Loading…</div>}>
      <DiamondVeinsContent />
    </Suspense>
  );
}
