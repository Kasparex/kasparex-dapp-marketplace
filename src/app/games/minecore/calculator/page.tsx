'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MinecoreCalculator } from '@/components/game/minecore/MinecoreCalculator';

function CalculatorContent() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute right-0 top-0 h-[50%] w-[50%] bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.12),transparent_70%)] blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[50%] w-[50%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.1),transparent_70%)] blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.04]" />
      </div>

      <Header />

      <main className="relative z-10 flex-1 p-4 lg:p-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
                <Link
                  href="/games"
                  className="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  ← Games
                </Link>
                <Link
                  href="/games/minecore"
                  className="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  ← Minecore
                </Link>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-4xl">Minecore calculator</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                Adjust sliders to compare machines, batteries, workers, boosts, and power plants. Outputs update in real time using the same formulas as the game client (yield, battery cap, drain, and partial cycles).
              </p>
            </div>
          </div>

          <MinecoreCalculator />

          <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-500">
            Estimates only. Token redemption previews mirror the rewards UI multipliers; on-chain balances may differ. Power install KAS includes only ingredients sold for KAS in the Minecore shop.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function MinecoreCalculatorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
          Loading…
        </div>
      }
    >
      <CalculatorContent />
    </Suspense>
  );
}
