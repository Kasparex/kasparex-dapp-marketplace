'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { NodeOverview } from './NodeOverview';
import { ConnectAndRegister } from './ConnectAndRegister';
import { StatusAndParameters } from './StatusAndParameters';
import { TechnicalRequirements } from './TechnicalRequirements';
import { IncentivesAndEarnings } from './IncentivesAndEarnings';
import { NodeTypesInfoCards } from './NodeTypesInfoCards';
import { ActiveNodesTable } from './ActiveNodesTable';
import { NodesMap } from './NodesMap';
import { KrexNodeEnrollmentModal } from './KrexNodeEnrollmentModal';
import { KrexNodeSetupGuide } from './KrexNodeSetupGuide';
import { KrexNodeDocsGuide } from './KrexNodeDocsGuide';
import { NodesPremiumPanel } from './NodesPremiumPanel';
import { NODES_DASH_CARD, NODES_TAB_STACK } from './nodesTabLayout';
import { useKrexNodeNetwork } from '@/hooks/useKrexNodeNetwork';
import { useKrexOperatorDashboard } from '@/hooks/useKrexOperatorDashboard';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { fetchNodeEpochReward } from '@/lib/nodes/operatorApi';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { SHOW_HUB_HALO_HEADERS } from '@/lib/hub/haloHeaders';
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
  verified_txid?: string | null;
  verified_at?: number | null;
}): KrexNode {
  return {
    node_id: row.node_id,
    node_name: row.node_name,
    url: row.url,
    region: row.region,
    role: (row.role as KrexNode['role']) || 'light',
    uptime: Number(row.uptime_hours) || 0,
    pinnedCids: [],
    verifiedTxid: row.verified_txid ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
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

const NODES_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'setup', label: 'Setup' },
  { id: 'docs', label: 'Docs' },
  { id: 'enroll', label: 'Enroll' },
  { id: 'premium', label: 'Premium' },
] as const;

type TabId = (typeof NODES_TABS)[number]['id'];

const TAB_IDS = new Set<string>(NODES_TABS.map((t) => t.id));

function NodesTabStrip({ activeTab, onTab }: { activeTab: TabId; onTab: (t: TabId) => void }) {
  return (
    <div className="mb-6">
      <div className="k-control-group w-full overflow-x-auto flex flex-nowrap min-w-0">
        {NODES_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            className={`h-10 shrink-0 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? 'bg-[#02abb8]/10 text-[#017a84] dark:text-[#8ff1f8]'
                : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NodesDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { state: kaspa } = useKaspaWallet();
  const { balance: krexBalance } = useKREXBalance();
  const { data: activeNodes = [] } = useKrexNodeNetwork();
  const { data: operator } = useKrexOperatorDashboard(kaspa.isConnected ? kaspa.address : null);
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
    const addr = kaspa.address?.trim();
    if (!addr || !operator?.myNodes?.length) return;
    const epoch = new Date().toISOString().slice(0, 10);
    let cancelled = false;
    void (async () => {
      for (const n of operator.myNodes) {
        if (cancelled) break;
        try {
          const r = await fetchNodeEpochReward(n.node_id, epoch);
          const fg = Number(r.final_grid ?? 0) || 0;
          if (fg <= 0) continue;
          appendHubActivityEarn({
            walletRaw: addr,
            source: 'krex_node_operator',
            redeemableDelta: HUB_EARN_POINTS.krexNodeOperatorDaily,
            krexBalance,
            idempotencyKey: `krex_node:epoch:${n.node_id}:${epoch}`,
            meta: { final_grid: fg, node_id: n.node_id },
          });
        } catch {
          /* ignore single node */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kaspa.address, operator?.myNodes, operator?.gridEarnedToday]);

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
    const tab = (searchParams?.get('tab') || 'dashboard').toLowerCase();
    if (TAB_IDS.has(tab)) setActiveTab(tab as TabId);
    else setActiveTab('dashboard');
  }, [searchParams]);

  type EnrollIntent = 'register' | 'manage';

  const goTab = (t: TabId, opts?: { enrollIntent?: EnrollIntent }) => {
    setActiveTab(t);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', t);
    if (t === 'enroll') {
      if (opts?.enrollIntent === 'manage') params.set('intent', 'manage');
      else params.delete('intent');
    } else {
      params.delete('intent');
    }
    router.replace(`/nodes?${params.toString()}`, { scroll: false });
  };

  const enrollManage = searchParams?.get('intent') === 'manage';
  const manageExistingNode =
    enrollManage && myNode
      ? {
          node_id: myNode.node_id,
          node_name: myNode.node_name,
          role: (myNode.role as 'light' | 'mirror' | 'super') || 'light',
          url: myNode.url,
          region: myNode.region,
          version: (myNode as { version?: string }).version || '1.0.0',
        }
      : null;

  return (
    <div className="space-y-10">
      {SHOW_HUB_HALO_HEADERS ? (
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
              <p className="kx-body max-w-2xl leading-relaxed mb-8">
                Manage your KREX node: connect and register, monitor status, and track incentives. Advanced diagnostics live under the Premium tab.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/nodes?tab=setup"
                  scroll={false}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-sm tracking-wide hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700"
                >
                  <span>Run a KREX Node</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <button
                  type="button"
                  onClick={() => goTab('enroll', myNode ? { enrollIntent: 'manage' } : { enrollIntent: 'register' })}
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
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <Link
              href="/nodes?tab=setup"
              scroll={false}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-sm tracking-wide hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              <span>Run a KREX Node</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => goTab('enroll', myNode ? { enrollIntent: 'manage' } : { enrollIntent: 'register' })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {myNode ? 'Edit node details' : 'Enroll (get node secret)'}
            </button>
          </div>
          <div className="w-full lg:max-w-xl">
            <IncentivesAndEarnings incentives={incentives} embedded />
          </div>
        </div>
      )}

      <NodesTabStrip activeTab={activeTab} onTab={goTab} />

      {activeTab === 'dashboard' ? (
        <>
          <NodeTypesInfoCards />
          <NodesMap nodes={activeNodes} />
          <ActiveNodesTable nodes={activeNodes} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <NodeOverview nodeInfo={nodeInfo} metrics={metrics} />
              <ConnectAndRegister nodeInfo={nodeInfo} onEnrollClick={() => goTab('enroll', { enrollIntent: 'register' })} />
            </div>
            <div className="space-y-6">
              <StatusAndParameters nodeInfo={nodeInfo} metrics={metrics} />
              <TechnicalRequirements requirements={technicalRequirements as any} />
            </div>
          </div>
        </>
      ) : activeTab === 'setup' ? (
        <div className={NODES_TAB_STACK}>
          <KrexNodeSetupGuide />
        </div>
      ) : activeTab === 'docs' ? (
        <div className={NODES_TAB_STACK}>
          <KrexNodeDocsGuide />
        </div>
      ) : activeTab === 'enroll' ? (
        <div className={NODES_TAB_STACK}>
          <div className={NODES_DASH_CARD}>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Register &amp; enroll</h2>
            <p className="kx-body">
              Connect your Kaspa wallet and complete the Worker flow: signed challenge, on-chain 1 KAS verification (new
              enrollments), then node details. Your{' '}
              <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">node_secret</code> is shown only
              after a successful enroll.
              {myNode ? (
                <>
                  {' '}
                  You already have a node: use <span className="font-semibold text-zinc-800 dark:text-zinc-200">Edit node details</span>{' '}
                  on the Dashboard hero to update it without the 1 KAS step, or append{' '}
                  <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">?intent=manage</code> to this page
                  URL.
                </>
              ) : null}
            </p>
          </div>
          <KrexNodeEnrollmentModal
            isOpen
            embedded
            onClose={() => goTab('dashboard')}
            existingNode={manageExistingNode}
          />
        </div>
      ) : (
        <div className={NODES_TAB_STACK}>
          <NodesPremiumPanel />
        </div>
      )}

    </div>
  );
}
