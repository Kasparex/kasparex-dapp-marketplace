'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { KrexNode } from '@/lib/storage/krex-nodes';
import { FieldHint } from '@/components/ui/FieldHint';
import { SectionHeader } from './SectionHeader';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

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
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-bold mb-2">
                Node-first result{' '}
                <FieldHint text="This call goes through node-first routing. If a community node is reachable, it should show Source: node and its URL. Otherwise it will fall back to central." />
              </div>
              {data.node ? (
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-500">Source:</span>{' '}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{data.node.source}</span>
                    <span className="ml-2 inline-flex align-middle">
                      <FieldHint text="node = served by a community node. central = node-first fell back to the Worker API." />
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-500">Node:</span>{' '}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{data.node.nodeUrl ?? '-'}</span>
                    <span className="ml-2 inline-flex align-middle">
                      <FieldHint text="URL of the node that served the response (when Source=node). Useful for debugging trust/latency." />
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-500">Latency:</span>{' '}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{ms(data.node.elapsedMs)}</span>
                    <span className="ml-2 inline-flex align-middle">
                      <FieldHint text="Measured client-side duration for the request. Includes network + node processing." />
                    </span>
                  </div>
                  <div className="pt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    {data.node.payload?.service ?? 'Service'} · {data.node.payload?.version ?? 'v?'}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-500 dark:text-zinc-500">
                  Node-first disabled. Set `NEXT_PUBLIC_NODE_FIRST_READS=true` to enable.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-bold mb-2">
                Central fallback <FieldHint text="Direct call to the Worker API (central). Used as baseline latency and to validate payload consistency." />
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-500">Source:</span>{' '}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">central</span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-500">Latency:</span>{' '}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{ms(data.central.elapsedMs)}</span>
                </div>
                <div className="pt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  {data.central.payload?.service ?? 'Service'} · {data.central.payload?.version ?? 'v?'}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 lg:col-span-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-bold mb-2">
                Stats endpoint test (`/kasparex/stats`) <FieldHint text="This endpoint is a good read-heavy example: nodes can cache it, and it’s easy to compare node vs central responses." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">Node-first</div>
                  {data.nodeStats ? (
                    <div className="space-y-1">
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-500">Source:</span>{' '}
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{data.nodeStats.source}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-500">Node:</span>{' '}
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {data.nodeStats.nodeUrl ?? '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-500">Latency:</span>{' '}
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {ms(data.nodeStats.elapsedMs)}
                        </span>
                      </div>
                      <div className="pt-1 text-xs text-zinc-500 dark:text-zinc-500">
                        Nodes: {data.nodeStats.payload?.totalNodes ?? '-'} (mirror {data.nodeStats.payload?.mirrorNodes ?? '-'}
                        , light {data.nodeStats.payload?.lightNodes ?? '-'})
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-500 dark:text-zinc-500">Disabled</div>
                  )}
                </div>

                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">Central</div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-500">Latency:</span>{' '}
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{ms(data.centralStats.elapsedMs)}</span>
                    </div>
                    <div className="pt-1 text-xs text-zinc-500 dark:text-zinc-500">
                      Nodes: {data.centralStats.payload?.totalNodes ?? '-'} (mirror {data.centralStats.payload?.mirrorNodes ?? '-'}
                      , light {data.centralStats.payload?.lightNodes ?? '-'})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

