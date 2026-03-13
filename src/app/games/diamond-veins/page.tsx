'use client';

import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MiningDashboard } from '@/components/game/MiningDashboard';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { placeholderGames, getGameBySlug } from '@/lib/games/games';
import Link from 'next/link';

function DiamondVeinsContent() {
  const { state } = useKaspaWallet();
  const game = getGameBySlug(placeholderGames, 'diamond-veins');

  if (!game) return <div>Game not found</div>;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white overflow-hidden relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.1),transparent_70%)] blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.1),transparent_70%)] blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      <Header />

      <main className="flex-1 relative z-10 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          {/* Back Button */}
          <div className="mb-8">
            <Link 
              href="/games" 
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
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
                <h1 className="text-4xl font-black mb-2 italic">DIAMOND VEINS</h1>
                <p className="text-zinc-400 max-w-md mx-auto">
                   Wallet connection required to deploy your NFT workers and start mining Krex Diamonds.
                </p>
                <button 
                  onClick={() => (window as any).dispatchEvent(new CustomEvent('open-wallet-modal'))}
                  className="k-cta-primary h-14 px-8 text-lg"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <MiningDashboard />
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
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Initializing Kaspaland Cores...</div>}>
      <DiamondVeinsContent />
    </Suspense>
  );
}
