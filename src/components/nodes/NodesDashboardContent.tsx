'use client';

import { useEffect } from 'react';
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Halo header - Krex Nodes */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-100 via-cyan-50/30 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/20 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 mb-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.15),transparent_70%)] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(2,171,184,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(2,171,184,0.1),transparent_70%)] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex gap-2 px-3 py-1.5 rounded-full bg-[#02abb8]/10 border border-[#02abb8]/25 text-[#02abb8] text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            Infrastructure
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight tracking-tighter">
            Krex <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-[#02abb8] dark:from-cyan-400 dark:to-[#02abb8]">Nodes</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
            Manage your KREX node: connect and register, monitor status, and track incentives. Data is placeholder until the node system is wired.
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: Node overview, status, connection guide */}
        <div className="space-y-6">
          <NodeOverview nodeInfo={mockNodeInfo} metrics={mockNodeMetrics} />
          <ConnectAndRegister nodeInfo={mockNodeInfo} />
        </div>

        {/* Right column: Earnings, incentives, parameters, requirements */}
        <div className="space-y-6">
          <IncentivesAndEarnings incentives={mockIncentives} />
          <StatusAndParameters nodeInfo={mockNodeInfo} metrics={mockNodeMetrics} />
          <TechnicalRequirements requirements={mockTechnicalRequirements} />
        </div>
      </div>
    </div>
  );
}
