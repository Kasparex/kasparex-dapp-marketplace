'use client';

import { useGameMilestones, type GameMilestoneProgressInput } from '@/hooks/useGameMilestones';

/** Same blue chip as GamesHaloHeader Player Lv badge. */
const LEVEL_BADGE_CLS =
  'inline-flex items-center gap-2 rounded-full border border-sky-500/35 bg-sky-500/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-sky-800 dark:text-sky-200';

const LEVEL_PILL_CLS =
  'inline-flex rounded-full border border-sky-500/35 bg-sky-500/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-sky-800 dark:text-sky-200';

export function MilestonesPanel({
  gameId,
  progress,
  title = 'Milestones',
  kicker = 'Progress',
  subtitle = 'Complete goals in order to raise your Player level.',
}: {
  gameId: string;
  progress: GameMilestoneProgressInput;
  title?: string;
  kicker?: string;
  subtitle?: string;
}) {
  const { rows, level, completedCount, total } = useGameMilestones(gameId, progress);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="hub-tilt-bar-sm h-4 w-1 shrink-0 -skew-y-12 rounded-full" aria-hidden="true" />
            <span className="text-xs font-black uppercase tracking-widest text-[color:var(--hub-accent,#10b981)]">
              {kicker}
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        <span className={LEVEL_BADGE_CLS}>
          Player level {level}
          <span className="font-mono font-semibold text-sky-700/80 dark:text-sky-300/80">
            {completedCount}/{total}
          </span>
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
            <tr>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Level</th>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Milestone</th>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-zinc-500">
                  No milestones configured for this game yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="p-3 align-top">
                    <span className={LEVEL_PILL_CLS}>Lv {row.level}</span>
                  </td>
                  <td className="p-3 align-top">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</div>
                    <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      {row.completed ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Complete</span>
                      ) : (
                        <span>In progress</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 align-top">
                    <div className="tabular-nums text-zinc-700 dark:text-zinc-300">
                      {Math.floor(row.current).toLocaleString()} / {row.target.toLocaleString()}
                    </div>
                    <div className="mt-2 h-1.5 max-w-[10rem] overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${row.completed ? 'bg-emerald-500' : 'bg-sky-500'}`}
                        style={{ width: `${row.progressPct}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
