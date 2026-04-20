'use client';

import type { KrexNode } from '@/lib/storage/krex-nodes';

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
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
            <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
              Active node network
            </h2>
          </div>
          <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500">
            {nodes.length} active
          </div>
        </div>

        <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm leading-relaxed">
          These are nodes currently pinging the registry. The app can route read-heavy requests through them and fall back
          to the central API if needed.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left py-2 pr-4 font-bold">Role</th>
                <th className="text-left py-2 pr-4 font-bold">Region</th>
                <th className="text-left py-2 pr-4 font-bold">Uptime</th>
                <th className="text-left py-2 pr-4 font-bold">Pinned</th>
                <th className="text-left py-2 pr-4 font-bold">URL</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => (
                <tr
                  key={n.url}
                  className="border-b border-zinc-100 dark:border-zinc-800/70 text-zinc-700 dark:text-zinc-300"
                >
                  <td className="py-2 pr-4 font-semibold text-zinc-900 dark:text-zinc-100">{n.role}</td>
                  <td className="py-2 pr-4">{n.region || 'unknown'}</td>
                  <td className="py-2 pr-4">{typeof n.uptime === 'number' ? `${n.uptime.toFixed(1)}h` : '-'}</td>
                  <td className="py-2 pr-4">{Array.isArray(n.pinnedCids) ? n.pinnedCids.length : 0}</td>
                  <td className="py-2 pr-4">
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
                  <td colSpan={5} className="py-6 text-center text-zinc-500 dark:text-zinc-500">
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

