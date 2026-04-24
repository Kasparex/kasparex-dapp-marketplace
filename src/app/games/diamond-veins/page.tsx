'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MiningDashboard } from '@/components/game/MiningDashboard';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getGameBySlugFromRegistry } from '@/lib/games/registry';
import Link from 'next/link';
import { GameModulesBar } from '@/components/games/modules/GameModulesBar';

const KaspaL1WalletButton = dynamic(
  () => import('@/components/KaspaL1WalletButton').then((mod) => ({ default: mod.KaspaL1WalletButton })),
  { ssr: false }
);

const LORE_STORY = `Deep beneath the neon city of Kaspaland, hidden far below the surface, lies an ancient network of glowing crystal veins.

THE DISCOVERY
For centuries these crystals remained undiscovered, quietly forming within the underground layers of the metropolis. Their origin remained a mystery until Krex, the cryptography mastermind and founder of Kasparex, detected unusual energy patterns coming from deep underground.

KREX DIAMONDS
After months of analysis, Krex discovered that these crystals were not ordinary minerals. They were formed from BlockDAG energy flows traveling through the Kaspa network itself. These rare crystals became known as Krex Diamonds.

POWER AND EXTRACTION
Each diamond contains condensed fragments of network energy. When processed through special machines built by Vector, and monitored by the AI system ARIA, these diamonds can be converted into usable digital power that fuels the Kasparex infrastructure. Extracting them is not easy. The diamond veins are scattered throughout massive underground caverns beneath Kaspaland. Specialized operators, machines, and advanced technology are required to locate and safely extract them.

YOUR ROLE
To expand the operation, Krex opened the underground mining network to trusted operators across the ecosystem. This is where you come in. By deploying PixelKrex workers, KrexPrime operators, and other specialized units, you help Krex explore deeper sections of the underground network and extract these powerful crystals. The in-game diamonds you mine can be refined and converted into refinement points, helping to power the expanding Kasparex infrastructure.

THE DEPTHS
The deeper the mining operations go, the more mysterious the diamond veins become. Some miners whisper about rare crystal chambers, hidden cores of energy, and ancient veins that glow with unimaginable power. No one knows how deep the diamond network truly goes.

The Diamond Veins of Kaspaland are only beginning to reveal their secrets.`;

function DiamondVeinsContent() {
  const { state } = useKaspaWallet();
  const game = getGameBySlugFromRegistry('diamond-veins');

  if (!game) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Game not found</div>;

  const featuredImage = game.featuredImage ?? '';

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden relative">
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
            {!state.isConnected ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
                  <svg className="w-16 h-16 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-zinc-100">Diamond Veins</h1>
                <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto text-base">
                  Wallet connection required to deploy your NFT workers and start mining Krex Diamonds.
                </p>
                <div className="[&_button]:h-14 [&_button]:px-8 [&_button]:text-base">
                  <KaspaL1WalletButton />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Standard cross-game modules (Your rewards / Unified deck + Risk choice) */}
                <GameModulesBar />

                <MiningDashboard featuredImage={featuredImage} loreStory={LORE_STORY} gameDescription={game.description} game={game} gameName={game.name} />
              </div>
            )}
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
