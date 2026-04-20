'use client';

import type { NodeInfo, NodeMetrics } from '@/lib/nodes/types';
import { FieldHint } from '@/components/ui/FieldHint';
import { HealthDot, healthFromUptimeHours } from './HealthDot';
import { SectionHeader } from './SectionHeader';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

function statusDisplay(status: NodeInfo['status']): { label: string; className: string } {
  switch (status) {
    case 'connected':
      return { label: 'Connected', className: 'text-green-600 dark:text-green-400' };
    case 'disconnected':
      return { label: 'Disconnected', className: 'text-yellow-600 dark:text-yellow-400' };
    case 'syncing':
      return { label: 'Syncing', className: 'text-[#02abb8]' };
    case 'not_registered':
    default:
      return { label: '-', className: 'text-zinc-500 dark:text-zinc-500' };
  }
}

interface StatusAndParametersProps {
  nodeInfo: NodeInfo;
  metrics: NodeMetrics;
}

export function StatusAndParameters({ nodeInfo, metrics }: StatusAndParametersProps) {
  const status = statusDisplay(nodeInfo.status);
  const health = healthFromUptimeHours(nodeInfo.status === 'connected' ? metrics.uptimeHours : null);

  return (
    <section id="status-parameters" className="mb-6">
      <div className={CARD_CLASS}>
        <SectionHeader title="Parameters" />
        <ul className="space-y-0">
          <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-sm text-zinc-600 dark:text-zinc-400 inline-flex items-center gap-1.5">
              Status
              <FieldHint text="Overall health derived from registry presence + uptime hours." />
            </span>
            <span className={`text-sm font-semibold ${status.className} inline-flex items-center gap-2`}>
              <HealthDot level={health.level} label={health.label} />
              {status.label}
            </span>
          </li>
          <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-sm text-zinc-600 dark:text-zinc-400 inline-flex items-center gap-1.5">
              Uptime
              <FieldHint text="Uptime (hours) for the primary node as reported by the registry." />
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {typeof metrics.uptimeHours === 'number' ? `${metrics.uptimeHours.toFixed(1)}h` : '-'}
            </span>
          </li>
          <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-sm text-zinc-600 dark:text-zinc-400 inline-flex items-center gap-1.5">
              Pinned CIDs
              <FieldHint text="Number of pinned IPFS CIDs reported by the primary node." />
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{metrics.pinnedCids}</span>
          </li>
          {metrics.requestsServed != null && (
            <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-sm text-zinc-600 dark:text-zinc-400 inline-flex items-center gap-1.5">
                Requests served
                <FieldHint text="Total requests served (reported by node; typically available for mirror nodes)." />
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{metrics.requestsServed}</span>
            </li>
          )}
          {metrics.lastPingAt && (
            <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-sm text-zinc-600 dark:text-zinc-400 inline-flex items-center gap-1.5">
                Last ping
                <FieldHint text="Timestamp of the last registry heartbeat observed for this node." />
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {new Date(metrics.lastPingAt).toLocaleString()}
              </span>
            </li>
          )}
          {nodeInfo.nodeId && (
            <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-sm text-zinc-600 dark:text-zinc-400 inline-flex items-center gap-1.5">
                Node ID
                <FieldHint text="Node identifier reported by the registry." />
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{nodeInfo.nodeId}</span>
            </li>
          )}
          {nodeInfo.registeredAt && (
            <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <span className="text-sm text-zinc-600 dark:text-zinc-400 inline-flex items-center gap-1.5">
                Registered
                <FieldHint text="Registry registration timestamp (if tracked)." />
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{nodeInfo.registeredAt}</span>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
