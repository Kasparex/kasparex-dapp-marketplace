'use client';

import type { NodeInfo, NodeMetrics } from '@/lib/nodes/types';
import { FieldHint } from '@/components/ui/FieldHint';
import { HealthDot, healthFromUptimeHours } from './HealthDot';

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

function Row({ label, value, valueClassName = '' }: { label: string; value: string | number; valueClassName?: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider inline-flex items-center gap-1.5">
        {label}
      </span>
      <span className={`text-sm font-semibold text-zinc-900 dark:text-zinc-100 ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

export function StatusAndParameters({ nodeInfo, metrics }: StatusAndParametersProps) {
  const status = statusDisplay(nodeInfo.status);
  const health = healthFromUptimeHours(nodeInfo.status === 'connected' ? metrics.uptimeHours : null);

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
          <div className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider inline-flex items-center gap-1.5">
              Status
              <FieldHint text="Overall health indicator derived from registry presence + uptime hours." />
            </span>
            <span className={`text-sm font-semibold ${status.className} inline-flex items-center gap-2`}>
              <HealthDot level={health.level} label={health.label} />
              {status.label}
            </span>
          </div>
          <Row
            label="Uptime"
            value={typeof metrics.uptimeHours === 'number' ? `${metrics.uptimeHours.toFixed(1)}h` : '-'}
          />
          <div className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider inline-flex items-center gap-1.5">
              Uptime
              <FieldHint text="Uptime (hours) for the primary node as reported by the registry." />
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {typeof metrics.uptimeHours === 'number' ? `${metrics.uptimeHours.toFixed(1)}h` : '-'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider inline-flex items-center gap-1.5">
              Pinned CIDs
              <FieldHint text="Number of pinned IPFS CIDs reported by the primary node." />
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{metrics.pinnedCids}</span>
          </div>
          {metrics.requestsServed != null && (
            <div className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider inline-flex items-center gap-1.5">
                Requests served
                <FieldHint text="Total requests served (reported by node; typically available for mirror nodes)." />
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{metrics.requestsServed}</span>
            </div>
          )}
          {metrics.lastPingAt && (
            <div className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider inline-flex items-center gap-1.5">
                Last ping
                <FieldHint text="Timestamp of the last registry heartbeat observed for this node." />
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {new Date(metrics.lastPingAt).toLocaleString()}
              </span>
            </div>
          )}
          {nodeInfo.nodeId && (
            <div className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider inline-flex items-center gap-1.5">
                Node ID
                <FieldHint text="Node identifier reported by the registry." />
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{nodeInfo.nodeId}</span>
            </div>
          )}
          {nodeInfo.registeredAt && (
            <div className="flex justify-between items-center py-2.5 last:border-0">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider inline-flex items-center gap-1.5">
                Registered
                <FieldHint text="Registry registration timestamp (if tracked)." />
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{nodeInfo.registeredAt}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
