'use client';

import { KxBadge } from '@/components/ui/KxBadge';
import { KxHubPtsBadge } from '@/components/ui/KxHubPtsBadge';
import { KX_PANEL } from '@/lib/ui/kxLayout';
import { KX_TEXT_BODY_SM } from '@/lib/ui/kxTypography';

export type HubPtsEarnSource = {
  id: string;
  label: string;
  points: number;
  /** Element id to scroll into view (without #). */
  scrollTargetId?: string;
  status?: 'available' | 'earned' | 'coming_soon';
  detail?: string;
};

function scrollToTarget(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function statusVariant(status: HubPtsEarnSource['status']) {
  if (status === 'earned') return 'emerald' as const;
  if (status === 'coming_soon') return 'zinc' as const;
  return 'amber' as const;
}

function statusLabel(status: HubPtsEarnSource['status']) {
  if (status === 'earned') return 'Earned';
  if (status === 'coming_soon') return 'Soon';
  return 'Available';
}

/** Global panel: available Hub PTS earn opportunities for the current page/content. */
export function KxHubPtsEarnPanel({
  title = 'Hub PTS available',
  sources,
  className = '',
}: {
  title?: string;
  sources: HubPtsEarnSource[];
  className?: string;
}) {
  const earnable = sources.filter((s) => s.status !== 'earned' && s.status !== 'coming_soon');
  const totalAvailable = earnable.reduce((sum, s) => sum + Math.max(0, s.points), 0);

  if (sources.length === 0) return null;

  return (
    <section
      className={`${KX_PANEL} relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/8 via-teal-500/5 to-cyan-500/5 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/20 p-4 sm:p-5 ${className}`.trim()}
      aria-labelledby="hub-pts-earn-heading"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl"
        aria-hidden
      />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              Rewards hub
            </p>
            <h2 id="hub-pts-earn-heading" className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">
              {title}
            </h2>
          </div>
          {totalAvailable > 0 ? (
            <KxHubPtsBadge points={totalAvailable} title="Total Hub PTS you can still earn here" className="shrink-0" />
          ) : null}
        </div>

        <ul className="space-y-3">
          {sources.map((source) => (
            <li
              key={source.id}
              className="rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-white/70 dark:bg-zinc-950/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{source.label}</p>
                  {source.detail ? (
                    <p className={`${KX_TEXT_BODY_SM} text-sm mt-1 line-clamp-2`}>{source.detail}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <KxBadge variant={statusVariant(source.status)}>{statusLabel(source.status)}</KxBadge>
                  <span className="text-sm font-black tabular-nums text-emerald-700 dark:text-emerald-300">
                    +{source.points} PTS
                  </span>
                </div>
              </div>
              {source.scrollTargetId && source.status === 'available' ? (
                <button
                  type="button"
                  onClick={() => scrollToTarget(source.scrollTargetId!)}
                  className="mt-3 w-full rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-800 transition-colors hover:bg-emerald-500/20 dark:text-emerald-200"
                >
                  Go to module
                </button>
              ) : null}
            </li>
          ))}
        </ul>

        <p className={`${KX_TEXT_BODY_SM} text-sm mt-4`}>
          Earned Hub PTS appear in your{' '}
          <a href="/rewards" className="font-semibold text-[#02abb8] hover:underline">
            Rewards hub balance
          </a>
          .
        </p>
      </div>
    </section>
  );
}
