'use client';

import { KaspaComSwapWidget } from '@/components/defi/KaspaComSwapWidget';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SwapsContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'swap';
  
  // Default tokens for liquidity if not specified
  const defaultTokenA = '0x0fd8d408ce707f4e4f8e54193c4c55a3b969834b'; // KREX
  const defaultTokenB = '0x2c2ae87ba178f48637acae54b87c3924f544a83e'; // WKAS

  const inputCurrency = searchParams.get('inputCurrency') || (tab === 'liquidity' ? defaultTokenA : undefined);
  const outputCurrency = searchParams.get('outputCurrency') || (tab === 'liquidity' ? defaultTokenB : undefined);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-700 dark:text-violet-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </span>
          {tab === 'liquidity' ? 'Liquidity Pools' : 'Next-Gen DeFi'}
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-white mb-4">
          {tab === 'liquidity' ? (
            <>Provide <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-amber-600">Liquidity</span></>
          ) : (
            <>Seamless <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-amber-600">Token Swaps</span></>
          )}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-lg">
          {tab === 'liquidity' 
            ? 'Earn fees by providing liquidity to your favorite pairs. Support the ecosystem while growing your assets.'
            : 'Fast, secure, and low-cost trading on Kaspa. Swap between KREX, KAS, and your favorite ecosystem tokens.'}
        </p>
      </div>

      {/* Main Swap Area - Full Width Widget */}
      <div className="flex flex-col gap-12">
        <div className="w-full max-w-4xl mx-auto">
          <KaspaComSwapWidget 
            inputCurrency={inputCurrency}
            outputCurrency={outputCurrency}
            type={tab === 'liquidity' ? 'create-liquidity' : 'swap'}
          />
        </div>

        {/* Info Area Below Widget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-3">
              <span className="p-2 bg-violet-500/10 rounded-xl">💎</span>
              Why use Kasparex Swaps?
            </h2>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-violet-500/10 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold">1</div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 italic">Deep Liquidity</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Aggregated from top DEXs on Kaspa to ensure you get the best price execution.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">2</div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 italic">Institutional Security</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Audited smart contracts and non-custodial architecture keeps you in control.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden group flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="text-xl font-black mb-2 uppercase italic tracking-wider">KREX Multiplier</h3>
            <p className="text-violet-100 mb-6">Hold KREX to unlock trading fee discounts and higher rewards across the entire DeFi suite. Boost your liquidity mining rewards by up to 3x.</p>
            <div>
              <button className="px-6 py-2.5 bg-white text-violet-700 rounded-xl font-bold text-sm hover:bg-violet-50 transition-colors shadow-lg shadow-black/20">
                LEARN MORE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SwapsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-500 animate-pulse">Loading DeFi Ecosystem...</div>
      </div>
    }>
      <SwapsContent />
    </Suspense>
  );
}
