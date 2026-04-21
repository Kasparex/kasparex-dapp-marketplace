'use client';

import type { KrexNode } from '@/lib/storage/krex-nodes';
import { HealthDot, healthFromUptimeHours } from './HealthDot';
import { FieldHint } from '@/components/ui/FieldHint';
import { SectionHeader } from './SectionHeader';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

function shortUrl(url: string) {
  try {
    const u = new URL(url);
    return u.host;
  } catch {
    return url.replace(/^https?:\/\//, '').slice(0, 48);
  }
}

export function ActiveNodesTable(props: { nodes: KrexNode[] }) {
  const nodes = props.nodes ?? [];

  return (
    <section id="network" className="mb-6">
      <div className={CARD_CLASS}>
        <SectionHeader title="Active node network" right={<span>{nodes.length} active</span>} />

        <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm leading-relaxed">
          These are nodes currently pinging the registry. The app can route read-heavy requests through them and fall back
          to the central API if needed.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left py-2.5 pr-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Health{' '}
                  <FieldHint text="Simple health signal derived from node uptime hours. Green ≥ 1h, yellow 0.1–1h, red < 0.1h." />
                </th>
                <th className="text-left py-2.5 pr-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Role</th>
                <th className="text-left py-2.5 pr-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Region</th>
                <th className="text-left py-2.5 pr-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Uptime</th>
                <th className="text-left py-2.5 pr-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Pinned</th>
                <th className="text-left py-2.5 pr-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">URL</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => (
                <tr
                  key={n.node_id || n.url}
                  className="border-b border-zinc-100 dark:border-zinc-800/70"
                >
                  <td className="py-2.5 pr-4">
                    {(() => {
                      const h = healthFromUptimeHours(typeof n.uptime === 'number' ? n.uptime : null);
                      return <HealthDot level={h.level} label={h.label} />;
                    })()}
                  </td>
                  <td className="py-2.5 pr-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{n.role}</td>
                  <td className="py-2.5 pr-4 text-sm text-zinc-600 dark:text-zinc-400">{n.region || 'unknown'}</td>
                  <td className="py-2.5 pr-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {typeof n.uptime === 'number' ? `${n.uptime.toFixed(1)}h` : '-'}
                  </td>
                  <td className="py-2.5 pr-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {Array.isArray(n.pinnedCids) ? n.pinnedCids.length : 0}
                  </td>
                  <td className="py-2.5 pr-4 text-sm">
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-700 dark:text-cyan-400 hover:underline font-medium"
                      title={n.url}
                    >
                      {shortUrl(n.url)}
                    </a>
                  </td>
                </tr>
              ))}
              {nodes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-zinc-500 dark:text-zinc-500">
                    No active nodes found yet. When nodes start pinging the registry, they’ll appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

