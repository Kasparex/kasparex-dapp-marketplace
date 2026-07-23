'use client';

import { useGameMilestones, type GameMilestoneProgressInput } from '@/hooks/useGameMilestones';

export function MilestonesPanel({
  gameId,
  progress,
  title = 'Milestones',
}: {
  gameId: string;
  progress: GameMilestoneProgressInput;
  title?: string;
}) {
  const { rows, level, completedCount, total } = useGameMilestones(gameId, progress);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Long-term goals to chase. Stay engaged and unlock the next badge.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
          Player level {level}
          <span className="font-mono font-semibold text-emerald-700/80 dark:text-emerald-300/80">
            {completedCount}/{total}
          </span>
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
            <tr>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Milestone</th>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Progress</th>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Status</th>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Level</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-zinc-500">
                  No milestones configured for this game yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => <MilestoneRow key={row.id} row={row} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MilestoneRow({ row }: { row: ReturnType<typeof useGameMilestones>['rows'][number] }) {
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800">
      <td className="p-3">
        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</div>
        {row.description ? (
          <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{row.description}</div>
        ) : null}
        <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full ${row.completed ? 'bg-emerald-500' : 'bg-sky-500'}`}
            style={{ width: `${row.progressPct}%` }}
          />
        </div>
      </td>
      <td className="p-3 tabular-nums text-zinc-700 dark:text-zinc-300">
        {Math.floor(row.current).toLocaleString()} / {row.target.toLocaleString()}
      </td>
      <td className="p-3">
        {row.completed ? (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
            Complete
          </span>
        ) : (
          <span className="rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            In progress
          </span>
        )}
      </td>
      <td className="p-3">
        <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">
          Lv {row.level}
        </span>
      </td>
    </tr>
  );
}
