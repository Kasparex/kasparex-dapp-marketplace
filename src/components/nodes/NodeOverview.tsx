'use client';

import type { NodeInfo, NodeMetrics } from '@/lib/nodes/types';
import { FieldHint } from '@/components/ui/FieldHint';
import { HealthDot, healthFromUptimeHours } from './HealthDot';
import { SectionHeader } from './SectionHeader';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

const NODE_TYPE_LABELS: Record<string, string> = {
  light: 'Light Node',
  mirror: 'Mirror Node',
  super: 'Super Node',
};

function statusDisplay(status: NodeInfo['status']): { label: string; className: string } {
  switch (status) {
    case 'connected':
      return { label: 'Connected', className: 'text-green-600 dark:text-green-400' };
    case 'disconnected':
      return { label: 'Disconnected', className: 'text-yellow-600 dark:text-yellow-400' };
    case 'syncing':
      return { label: 'Syncing', className: 'text-cyan-600 dark:text-cyan-400' };
    case 'not_registered':
    default:
      return { label: 'Not registered', className: 'text-zinc-500 dark:text-zinc-500' };
  }
}

interface NodeOverviewProps {
  nodeInfo: NodeInfo;
  metrics: NodeMetrics;
}

export function NodeOverview({ nodeInfo, metrics }: NodeOverviewProps) {
  const status = statusDisplay(nodeInfo.status);
  const typeLabel = nodeInfo.status !== 'not_registered' ? NODE_TYPE_LABELS[nodeInfo.type] ?? nodeInfo.type : '-';
  const health = healthFromUptimeHours(nodeInfo.status === 'connected' ? metrics.uptimeHours : null);

  return (
    <section id="node-type" className="mb-6">
      <div className={CARD_CLASS}>
        <SectionHeader title="Node overview" />
        <ul className="space-y-0">
          <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-sm text-zinc-600 dark:text-zinc-400 inline-flex items-center gap-1.5">
              Type
              <FieldHint text="Derived from the primary active node (Mirror preferred, otherwise Light)." />
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{typeLabel}</span>
          </li>
          <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-sm text-zinc-600 dark:text-zinc-400 inline-flex items-center gap-1.5">
              Status
              <FieldHint text="Connected means at least one node is actively pinging the registry." />
            </span>
            <span className={`text-sm font-semibold ${status.className} inline-flex items-center gap-2`}>
              <HealthDot level={health.level} label={health.label} />
              {status.label}
            </span>
          </li>
          {nodeInfo.status !== 'not_registered' ? (
            <>
              <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm text-zinc-600 dark:text-zinc-400 inline-flex items-center gap-1.5">
                  Uptime
                  <FieldHint text="Uptime (hours) reported by the node registry for the primary node." />
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {typeof metrics.uptimeHours === 'number' ? `${metrics.uptimeHours.toFixed(1)}h` : '-'}
                </span>
              </li>
              <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <span className="text-sm text-zinc-600 dark:text-zinc-400 inline-flex items-center gap-1.5">
                  Pinned CIDs
                  <FieldHint text="How many IPFS CIDs the primary node reports as pinned." />
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{metrics.pinnedCids}</span>
              </li>
            </>
          ) : (
            <li className="py-2.5 text-sm text-zinc-500 dark:text-zinc-500">
              No node registered yet. Start a node and make it ping the registry to populate these stats.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
