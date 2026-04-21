'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { NodeOverview } from './NodeOverview';
import { ConnectAndRegister } from './ConnectAndRegister';
import { StatusAndParameters } from './StatusAndParameters';
import { TechnicalRequirements } from './TechnicalRequirements';
import { IncentivesAndEarnings } from './IncentivesAndEarnings';
import { NodeTypesInfoCards } from './NodeTypesInfoCards';
import { ActiveNodesTable } from './ActiveNodesTable';
import { NodeFirstDiagnosticsPanel } from './NodeFirstDiagnosticsPanel';
import { NodesMap } from './NodesMap';
import { KrexNodeEnrollmentModal } from './KrexNodeEnrollmentModal';
import { KrexNodeRunGuideContent } from './KrexNodeRunGuideContent';
import { useKrexNodeNetwork } from '@/hooks/useKrexNodeNetwork';
import { useKrexOperatorDashboard } from '@/hooks/useKrexOperatorDashboard';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { NodeInfo, NodeMetrics, Incentives } from '@/lib/nodes/types';
import type { KrexNode } from '@/lib/storage/krex-nodes';
import nodeRewardTiers from '@/config/node-reward-tiers.json';

function pickPrimaryNode(nodes: KrexNode[]): KrexNode | null {
  if (!nodes || nodes.length === 0) return null;
  const score = (n: KrexNode) => {
    const roleScore = n.role === 'mirror' ? 30 : n.role === 'super' ? 35 : n.role === 'light' ? 20 : 10;
    const uptimeScore = typeof n.uptime === 'number' ? Math.min(20, Math.max(0, n.uptime)) : 0;
    const pinnedScore = Array.isArray(n.pinnedCids) ? Math.min(10, n.pinnedCids.length / 10) : 0;
    return roleScore + uptimeScore + pinnedScore;
  };
  return [...nodes].sort((a, b) => score(b) - score(a))[0] ?? null;
}

function deriveNodeInfo(primary: KrexNode | null): NodeInfo {
  if (!primary) return { type: 'light', status: 'not_registered' };
  return {
    type: primary.role === 'mirror' ? 'mirror' : primary.role === 'super' ? 'super' : 'light',
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

function operatorRowToKrexNode(row: {
  node_id: string;
  node_name: string;
  url: string;
  region: string;
  role: string;
  uptime_hours: number;
}): KrexNode {
  return {
    node_id: row.node_id,
    node_name: row.node_name,
    url: row.url,
    region: row.region,
    role: (row.role as KrexNode['role']) || 'light',
    uptime: Number(row.uptime_hours) || 0,
    pinnedCids: [],
  };
}

function deriveIncentives(info: NodeInfo): Incentives {
  const role = info.type;
  const multTable = nodeRewardTiers.roleMultipliers as Record<string, number>;
  const feeTable = nodeRewardTiers.feeReductionPercent as Record<string, number>;
  const currentMultiplier =
    info.status === 'connected' ? multTable[role] ?? multTable.light ?? 1 : 1;
  const feeReductionPercent = info.status === 'connected' ? feeTable[role] ?? 0 : 0;
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

type TabId = 'dashboard' | 'setup';

function NodesTabStrip({ activeTab, onTab }: { activeTab: TabId; onTab: (t: TabId) => void }) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'setup', label: 'Setup / Docs' },
  ];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setIsOverflowing(el.scrollWidth > el.clientWidth + 8);
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const visibleCount = isOverflowing ? 1 : tabs.length;
  const visibleTabs = tabs.slice(0, visibleCount);
  const overflowTabs = tabs.slice(visibleCount);

  return (
    <div className="mb-6">
      <div ref={containerRef} className="k-control-group w-full overflow-x-auto">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setOverflowOpen(false);
              onTab(t.id);
            }}
            className={`h-10 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? 'bg-[#02abb8]/10 text-[#017a84] dark:text-[#8ff1f8]'
                : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            {t.label}
          </button>
        ))}

        {overflowTabs.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOverflowOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={overflowOpen}
              className={`h-10 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                overflowTabs.some((t) => t.id === activeTab)
                  ? 'bg-[#02abb8]/10 text-[#017a84] dark:text-[#8ff1f8]'
                  : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="sr-only">More tabs</span>
              <span aria-hidden className="text-lg leading-none">
                ⋯
              </span>
            </button>
            {overflowOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 min-w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1 z-50"
              >
                {overflowTabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOverflowOpen(false);
                      onTab(t.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      activeTab === t.id
                        ? 'bg-[#02abb8]/10 text-[#017a84] dark:text-[#8ff1f8]'
                        : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function NodesDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { state: kaspa } = useKaspaWallet();
  const { data: activeNodes = [] } = useKrexNodeNetwork();
  const { data: operator } = useKrexOperatorDashboard(kaspa.isConnected ? kaspa.address : null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const myNode = operator?.myNodes?.[0] ?? null;

  const primaryNode = useMemo(() => {
    const mine = operator?.myNodes?.[0];
    if (mine) return operatorRowToKrexNode(mine);
    return pickPrimaryNode(activeNodes);
  }, [operator?.myNodes, activeNodes]);

  const nodeInfo = deriveNodeInfo(primaryNode);
  const metrics = deriveNodeMetrics(primaryNode);
  const incentives: Incentives = useMemo(
    () => ({
      ...deriveIncentives(nodeInfo),
      gridEarned: operator?.gridEarnedToday ?? 0,
    }),
    [nodeInfo, operator?.gridEarnedToday]
  );

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  useEffect(() => {
    const tab = (searchParams?.get('tab') || '').toLowerCase();
    if (tab === 'setup') setActiveTab('setup');
    else setActiveTab('dashboard');
  }, [searchParams]);

  const goTab = (t: TabId) => {
    setActiveTab(t);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', t);
    router.replace(`/nodes?${params.toString()}`);
  };

  return (
    <div className="space-y-10">
      {/* Header - Donations style (cyan gradient, same structure) */}
      <div className="relative mb-12 py-12 px-6 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/40 dark:to-zinc-950 border border-zinc-200 dark:border-transparent">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#06b6d4,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#0891b2,transparent_50%)]" />
        </div>
        <div className="relative z-10 w-full">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                Krex Nodes
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
                <span className="text-white">Krex</span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-500 dark:from-cyan-400 dark:to-cyan-300">
                  Nodes
                </span>
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed mb-8">
                Manage your KREX node: connect and register, monitor status, and track incentives. The network table and diagnostics are live.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/nodes?tab=setup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-sm tracking-wide hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700"
                >
                  <span>Run a KREX Node</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <button
                  type="button"
                  onClick={() => setEnrollOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {myNode ? 'Edit node details' : 'Enroll (get node secret)'}
                </button>
              </div>
            </div>

            <div className="w-full lg:w-[460px]">
              <IncentivesAndEarnings incentives={incentives} embedded />
            </div>
          </div>
        </div>
      </div>

      <NodesTabStrip activeTab={activeTab} onTab={goTab} />

      {activeTab === 'setup' ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6">
          <KrexNodeRunGuideContent />
        </div>
      ) : (
        <>
          <NodeTypesInfoCards />
          <NodesMap nodes={activeNodes} />
          <ActiveNodesTable nodes={activeNodes} />
          <NodeFirstDiagnosticsPanel />

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <NodeOverview nodeInfo={nodeInfo} metrics={metrics} />
              <ConnectAndRegister nodeInfo={nodeInfo} onEnrollClick={() => setEnrollOpen(true)} />
            </div>
            <div className="space-y-6">
              <StatusAndParameters nodeInfo={nodeInfo} metrics={metrics} />
              <TechnicalRequirements requirements={technicalRequirements as any} />
            </div>
          </div>
        </>
      )}

      <KrexNodeEnrollmentModal
        isOpen={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        existingNode={
          myNode
            ? {
                node_id: myNode.node_id,
                node_name: myNode.node_name,
                role: (myNode.role as any) || 'light',
                url: myNode.url,
                region: myNode.region,
                version: (myNode as any).version || '1.0.0',
              }
            : null
        }
      />
    </div>
  );
}
