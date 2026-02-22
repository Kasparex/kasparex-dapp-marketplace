'use client';

import type { NodeInfo, NodeMetrics } from '@/lib/nodes/types';

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
      return { label: '—', className: 'text-zinc-500 dark:text-zinc-500' };
  }
}

interface StatusAndParametersProps {
  nodeInfo: NodeInfo;
  metrics: NodeMetrics;
}

function Row({ label, value, valueClassName = '' }: { label: string; value: string | number; valueClassName?: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-semibold text-zinc-900 dark:text-zinc-100 ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

export function StatusAndParameters({ nodeInfo, metrics }: StatusAndParametersProps) {
  const status = statusDisplay(nodeInfo.status);

  return (
    <section id="status-parameters" className="mb-6">
      <div className={CARD_CLASS}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
          <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
            Parameters
          </h2>
        </div>
        <div className="space-y-0">
          <Row label="Status" value={status.label} valueClassName={status.className} />
          <Row label="Uptime" value={`${metrics.uptimePercent}%`} />
          <Row label="Pinned CIDs" value={metrics.pinnedCids} />
          {metrics.requestsServed != null && (
            <Row label="Requests served" value={metrics.requestsServed} />
          )}
          {metrics.lastPingAt && (
            <Row label="Last ping" value={new Date(metrics.lastPingAt).toLocaleString()} />
          )}
          {nodeInfo.nodeId && <Row label="Node ID" value={nodeInfo.nodeId} />}
          {nodeInfo.registeredAt && <Row label="Registered" value={nodeInfo.registeredAt} />}
        </div>
      </div>
    </section>
  );
}
