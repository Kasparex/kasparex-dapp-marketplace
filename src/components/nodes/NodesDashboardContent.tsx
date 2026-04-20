'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { NodeOverview } from './NodeOverview';
import { ConnectAndRegister } from './ConnectAndRegister';
import { StatusAndParameters } from './StatusAndParameters';
import { TechnicalRequirements } from './TechnicalRequirements';
import { IncentivesAndEarnings } from './IncentivesAndEarnings';
import { NodeTypesInfoCards } from './NodeTypesInfoCards';
import { ActiveNodesTable } from './ActiveNodesTable';
import { NodeFirstDiagnosticsPanel } from './NodeFirstDiagnosticsPanel';
import { useKrexNodeNetwork } from '@/hooks/useKrexNodeNetwork';
import type { NodeInfo, NodeMetrics, Incentives } from '@/lib/nodes/types';
import type { KrexNode } from '@/lib/storage/krex-nodes';

function pickPrimaryNode(nodes: KrexNode[]): KrexNode | null {
  if (!nodes || nodes.length === 0) return null;
  const score = (n: KrexNode) => {
    const roleScore = n.role === 'mirror' ? 30 : n.role === 'light' ? 20 : 10;
    const uptimeScore = typeof n.uptime === 'number' ? Math.min(20, Math.max(0, n.uptime)) : 0;
    const pinnedScore = Array.isArray(n.pinnedCids) ? Math.min(10, n.pinnedCids.length / 10) : 0;
    return roleScore + uptimeScore + pinnedScore;
  };
  return [...nodes].sort((a, b) => score(b) - score(a))[0] ?? null;
}

function deriveNodeInfo(primary: KrexNode | null): NodeInfo {
  if (!primary) return { type: 'light', status: 'not_registered' };
  return {
    type: primary.role === 'mirror' ? 'mirror' : 'light',
    status: 'connected',
    nodeId: primary.node_id || primary.node_name || primary.url,
  };
}

function deriveNodeMetrics(primary: KrexNode | null): NodeMetrics {
  return {
    uptimeHours: typeof primary?.uptime === 'number' ? primary!.uptime : 0,
    pinnedCids: Array.isArray(primary?.pinnedCids) ? primary!.pinnedCids.length : 0,
  };
}

function deriveIncentives(info: NodeInfo): Incentives {
  // Until we have operator accounting, show multiplier/fee reduction based on node type.
  const currentMultiplier = info.status === 'connected' ? (info.type === 'mirror' ? 5 : 4) : 1;
  const feeReductionPercent = info.status === 'connected' ? (info.type === 'mirror' ? 0.2 : 0.1) : 0;
  return { gridEarned: 0, xpEarned: 0, currentMultiplier, feeReductionPercent };
}

const technicalRequirements = [
  { label: 'Node.js', value: '20.x or 22.x LTS' },
  { label: 'RAM', value: '128 MB min; 256 MB recommended' },
  { label: 'CPU', value: 'Low (I/O-bound)' },
  { label: 'Disk', value: '≥ 1 GB; more if pinning many CIDs' },
  { label: 'Network', value: 'Stable outbound; inbound for Mirror' },
  { label: 'OS', value: 'Linux, macOS, Windows, Raspberry Pi' },
] as const;

export function NodesDashboardContent() {
  const { data: activeNodes = [] } = useKrexNodeNetwork();
  const primaryNode = pickPrimaryNode(activeNodes);
  const nodeInfo = deriveNodeInfo(primaryNode);
  const metrics = deriveNodeMetrics(primaryNode);
  const incentives = deriveIncentives(nodeInfo);

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
      {/* Header - Donations style (cyan gradient, same structure) */}
      <div className="relative mb-12 py-12 px-6 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/40 dark:to-zinc-950 border border-zinc-200 dark:border-transparent">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#06b6d4,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#0891b2,transparent_50%)]" />
        </div>
        <div className="relative z-10 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            Krex Nodes
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
            Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-500 dark:from-cyan-400 dark:to-cyan-300">Krex Nodes</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed mb-8">
            Manage your KREX node: connect and register, monitor status, and track incentives. The network table and diagnostics are live.
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

      <NodeTypesInfoCards />
      <ActiveNodesTable nodes={activeNodes} />
      <NodeFirstDiagnosticsPanel />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <NodeOverview nodeInfo={nodeInfo} metrics={metrics} />
          <ConnectAndRegister nodeInfo={nodeInfo} />
        </div>
        <div className="space-y-6">
          <IncentivesAndEarnings incentives={incentives} />
          <StatusAndParameters nodeInfo={nodeInfo} metrics={metrics} />
          <TechnicalRequirements requirements={technicalRequirements as any} />
        </div>
      </div>
    </div>
  );
}
