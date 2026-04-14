'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DAppGrid } from '@/components/DAppGrid';
import { placeholderDApps } from '@/lib/dapps';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';

const MODULE_DAPP_IDS = [
  'revenue-tree',
  'genesis-badge',
  '12', // DAO Voting
  '11', // Simple Payment
] as const;

export default function ModulesPage() {
  const [networkFilter, setNetworkFilter] = useState<'all' | 'L1' | 'L2'>('all');

  const moduleDApps = useMemo(() => {
    const base = placeholderDApps.filter((d) => MODULE_DAPP_IDS.includes(d.id as any));
    return base;
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-white via-cyan-500/5 to-transparent dark:from-zinc-900 dark:via-cyan-500/10 dark:to-zinc-950 p-8 sm:p-10 mb-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-800 dark:text-cyan-300 mb-4">
              Kasparex modules
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
              Power-ups for your Kasparex journey
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
              Modules are focused dApps that enhance your experience across Kasparex (rewards, tracking, utilities).
              They follow the same wallet + network gating behavior as the marketplace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dapps" className="k-control-btn">
                Explore dApps
              </Link>
              <Link href="/build-dapp" className="k-control-btn">
                List Your dApp
              </Link>
              <Link href="/dashboard" className="k-control-btn">
                Revenue Tree
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Modules</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                A curated set of Kasparex modules.
              </p>
            </div>
            <NetworkSwitcher value={networkFilter} onChange={setNetworkFilter} />
          </div>

          <DAppGrid dapps={moduleDApps} selectedNetwork={networkFilter} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

