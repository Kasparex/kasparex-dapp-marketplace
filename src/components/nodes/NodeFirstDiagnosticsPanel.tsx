'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { KrexNode } from '@/lib/storage/krex-nodes';
import { FieldHint } from '@/components/ui/FieldHint';
import { SectionHeader } from './SectionHeader';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

const SUBCARD_CLASS = 'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4';

const SUBCARD_TITLE_CLASS = 'text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2';

function KVRow(props: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-x-3 gap-y-1 text-sm">
      <div className="text-zinc-500 dark:text-zinc-500">{props.label}</div>
      <div className="text-zinc-900 dark:text-zinc-100 font-semibold leading-snug">
        <span className="inline-flex items-center gap-2">
          <span>{props.children}</span>
          {props.hint ? <span className="inline-flex align-middle">{props.hint}</span> : null}
        </span>
      </div>
    </div>
  );
}

type HealthResponse = {
  status: string;
  timestamp?: number;
  service?: string;
  version?: string;
};

type StatsResponse = {
  totalNodes?: number;
  lightNodes?: number;
  mirrorNodes?: number;
  superNodes?: number;
  totalUptimeHours?: number;
};

function ms(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '-';
  return `${Math.round(n)}ms`;
}

export function NodeFirstDiagnosticsPanel() {
  const enabled = process.env.NEXT_PUBLIC_NODE_FIRST_READS !== 'false';

  const { data, isLoading, error } = useQuery({
    queryKey: ['node-first-diagnostics', enabled ? 'enabled' : 'disabled'],
    queryFn: async () => {
      const started = performance.now();
      const { nodeFirstGet } = await import('@/lib/nodes/node-first');
      const nodeRes = enabled
        ? await nodeFirstGet<HealthResponse>('/health', {
            roles: ['mirror', 'light'] as KrexNode['role'][],
            maxNodeAttempts: 2,
            timeoutMs: 2000,
          })
        : null;
      const nodeElapsed = nodeRes ? performance.now() - started : null;

      const startedStats = performance.now();
      const nodeStats = enabled
        ? await nodeFirstGet<StatsResponse>('/kasparex/stats', {
            roles: ['mirror', 'light'] as KrexNode['role'][],
            maxNodeAttempts: 2,
            timeoutMs: 2200,
          })
        : null;
      const nodeStatsElapsed = nodeStats ? performance.now() - startedStats : null;

      const startedCentral = performance.now();
      const central = await apiClient.get<HealthResponse>('/health');
      const centralElapsed = performance.now() - startedCentral;

      const startedCentralStats = performance.now();
      const centralStats = await apiClient.get<StatsResponse>('/kasparex/stats');
      const centralStatsElapsed = performance.now() - startedCentralStats;

      return {
        enabled,
        node: nodeRes
          ? {
              source: nodeRes.source,
              nodeUrl: nodeRes.nodeUrl,
              elapsedMs: nodeElapsed,
              payload: nodeRes.data,
            }
          : null,
        nodeStats: nodeStats
          ? {
              source: nodeStats.source,
              nodeUrl: nodeStats.nodeUrl,
              elapsedMs: nodeStatsElapsed,
              payload: nodeStats.data,
            }
          : null,
        central: {
          elapsedMs: centralElapsed,
          payload: central,
        },
        centralStats: {
          elapsedMs: centralStatsElapsed,
          payload: centralStats,
        },
      };
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  return (
    <section id="diagnostics" className="mb-6">
      <div className={CARD_CLASS}>
        <SectionHeader
          title="Node-first diagnostics"
          hint="Compares node-first routing vs central API for key read endpoints."
          right={<span>{enabled ? 'Enabled' : 'Disabled'}</span>}
        />

        <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm leading-relaxed">
          Quick health check showing whether a request was served by a community node or the central API. This is the
          routing pattern we’ll use for read-heavy game-core endpoints later.
        </p>

        {isLoading && <div className="text-sm text-zinc-500 dark:text-zinc-500">Loading…</div>}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">
            Diagnostics failed: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={SUBCARD_CLASS}>
              <div className={SUBCARD_TITLE_CLASS}>
                <span>Node-first result</span>
                <FieldHint text="This call goes through node-first routing. If a community node is reachable, it should show Source: node and its URL. Otherwise it will fall back to central." />
              </div>
              {data.node ? (
                <div className="space-y-2">
                  <KVRow
                    label="Source"
                    hint={<FieldHint text="node = served by a community node. central = node-first fell back to the Worker API." />}
                  >
                    {data.node.source}
                  </KVRow>
                  <KVRow
                    label="Node"
                    hint={
                      <FieldHint text="URL of the node that served the response (when Source=node). Useful for debugging trust/latency." />
                    }
                  >
                    {data.node.nodeUrl ?? '-'}
                  </KVRow>
                  <KVRow
                    label="Latency"
                    hint={<FieldHint text="Measured client-side duration for the request. Includes network + node processing." />}
                  >
                    {ms(data.node.elapsedMs)}
                  </KVRow>
                  <div className="pt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    {data.node.payload?.service ?? 'Service'} · {data.node.payload?.version ?? 'v?'}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-500 dark:text-zinc-500">
                  Node-first disabled. Set `NEXT_PUBLIC_NODE_FIRST_READS=true` to enable.
                </div>
              )}
            </div>

            <div className={SUBCARD_CLASS}>
              <div className={SUBCARD_TITLE_CLASS}>
                <span>Central fallback</span>
                <FieldHint text="Direct call to the Worker API (central). Used as baseline latency and to validate payload consistency." />
              </div>
              <div className="space-y-2">
                <KVRow label="Source">central</KVRow>
                <KVRow label="Latency">{ms(data.central.elapsedMs)}</KVRow>
                <div className="pt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  {data.central.payload?.service ?? 'Service'} · {data.central.payload?.version ?? 'v?'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`${CARD_CLASS} mt-6`}>
        <SectionHeader
          title="Stats endpoint test (/kasparex/stats)"
          hint="Read-heavy example endpoint to compare node-first vs central payloads and latency."
        />

        {data ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div className={SUBCARD_CLASS}>
              <div className={SUBCARD_TITLE_CLASS}>
                <span>Node-first</span>
                <FieldHint text="This call uses node-first routing (node or central fallback depending on availability)." />
              </div>

              {data.nodeStats ? (
                <div className="space-y-2">
                  <KVRow label="Source">{data.nodeStats.source}</KVRow>
                  <KVRow label="Node">{data.nodeStats.nodeUrl ?? '-'}</KVRow>
                  <KVRow label="Latency">{ms(data.nodeStats.elapsedMs)}</KVRow>
                  <div className="pt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    Nodes: {data.nodeStats.payload?.totalNodes ?? '-'} (mirror {data.nodeStats.payload?.mirrorNodes ?? '-'}, light{' '}
                    {data.nodeStats.payload?.lightNodes ?? '-'})
                  </div>
                </div>
              ) : (
                <div className="text-zinc-500 dark:text-zinc-500">Disabled</div>
              )}
            </div>

            <div className={SUBCARD_CLASS}>
              <div className={SUBCARD_TITLE_CLASS}>
                <span>Central</span>
                <FieldHint text="Direct call to the Worker API (central) as baseline." />
              </div>

              <div className="space-y-2">
                <KVRow label="Latency">{ms(data.centralStats.elapsedMs)}</KVRow>
                <div className="pt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  Nodes: {data.centralStats.payload?.totalNodes ?? '-'} (mirror {data.centralStats.payload?.mirrorNodes ?? '-'}, light{' '}
                  {data.centralStats.payload?.lightNodes ?? '-'})
                </div>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-sm text-zinc-500 dark:text-zinc-500">Loading…</div>
        ) : null}
      </div>
    </section>
  );
}

