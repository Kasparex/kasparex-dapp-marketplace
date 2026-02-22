'use client';

import type { NodeInfo, NodeMetrics } from '@/lib/nodes/types';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

const NODE_TYPE_LABELS: Record<string, string> = {
  light: 'Light Node',
  mirror: 'Mirror Node',
};

function statusDisplay(status: NodeInfo['status']): { label: string; className: string } {
  switch (status) {
    case 'connected':
      return { label: 'Connected', className: 'text-green-600 dark:text-green-400' };
    case 'disconnected':
      return { label: 'Disconnected', className: 'text-yellow-600 dark:text-yellow-400' };
    case 'syncing':
      return { label: 'Syncing', className: 'text-emerald-600 dark:text-emerald-400' };
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
  const typeLabel = nodeInfo.status !== 'not_registered' ? NODE_TYPE_LABELS[nodeInfo.type] ?? nodeInfo.type : '—';

  return (
    <section id="node-type" className="mb-6">
      <div className={CARD_CLASS}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
            Node overview
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Type
            </p>
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {typeLabel}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Status
            </p>
            <p className={`text-base font-semibold ${status.className}`}>
              {status.label}
            </p>
          </div>
          {nodeInfo.status !== 'not_registered' && (
            <>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Uptime
                </p>
                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {metrics.uptimePercent}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Pinned CIDs
                </p>
                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {metrics.pinnedCids}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
