'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { NodeOverview } from './NodeOverview';
import { ConnectAndRegister } from './ConnectAndRegister';
import { StatusAndParameters } from './StatusAndParameters';
import { TechnicalRequirements } from './TechnicalRequirements';
import { IncentivesAndEarnings } from './IncentivesAndEarnings';
import {
  mockNodeInfo,
  mockNodeMetrics,
  mockIncentives,
  mockTechnicalRequirements,
} from '@/lib/nodes/mock';

export function NodesDashboardContent() {
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  return (
    <div className="space-y-10">
      {/* Header - Donations style (emerald gradient, same structure) */}
      <div className="relative mb-12 py-12 px-6 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-emerald-50/50 to-zinc-100 dark:from-zinc-950 dark:via-emerald-950/40 dark:to-zinc-950 border border-zinc-200 dark:border-transparent">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#10b981,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#059669,transparent_50%)]" />
        </div>
        <div className="relative z-10 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Krex Nodes
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
            Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">Krex Nodes</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed mb-8">
            Manage your KREX node: connect and register, monitor status, and track incentives. Values below are illustrative until the node system is wired.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/api/krex-node"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-sm tracking-wide hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              <span>Run a KREX Node</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/api/krex-node"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Setup guide
            </Link>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <NodeOverview nodeInfo={mockNodeInfo} metrics={mockNodeMetrics} />
          <ConnectAndRegister nodeInfo={mockNodeInfo} />
        </div>
        <div className="space-y-6">
          <IncentivesAndEarnings incentives={mockIncentives} />
          <StatusAndParameters nodeInfo={mockNodeInfo} metrics={mockNodeMetrics} />
          <TechnicalRequirements requirements={mockTechnicalRequirements} />
        </div>
      </div>
    </div>
  );
}
