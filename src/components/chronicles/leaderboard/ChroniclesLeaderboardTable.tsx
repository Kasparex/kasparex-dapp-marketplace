'use client';

import { Tooltip } from '@/components/ui/Tooltip';

export type ChroniclesLeaderboardRow = {
  wallet: string;
  totalScore: number;
  filledSlotsCount: number;
  confirmedReadsCount: number;
  lastActivityMs: number;
};

function shortWallet(w: string): string {
  const t = w.trim();
  if (t.length <= 18) return t;
  return `${t.slice(0, 10)}…${t.slice(-6)}`;
}

function medalRowClass(rank: number): string {
  if (rank === 1) return 'bg-amber-500/10 border-amber-500/25';
  if (rank === 2) return 'bg-zinc-400/10 border-zinc-300 dark:border-zinc-700';
  if (rank === 3) return 'bg-orange-500/10 border-orange-500/20';
  return 'bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800';
}

function medalBadge(rank: number): { label: string; className: string } | null {
  if (rank === 1) return { label: 'Gold', className: 'text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10' };
  if (rank === 2) return { label: 'Silver', className: 'text-zinc-700 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 bg-zinc-500/10' };
  if (rank === 3) return { label: 'Bronze', className: 'text-orange-800 dark:text-orange-300 border-orange-500/25 bg-orange-500/10' };
  return null;
}

export function ChroniclesLeaderboardTable({ rows }: { rows: ChroniclesLeaderboardRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-base">
        <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-left text-sm font-black uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="p-4 w-20">Rank</th>
            <th className="p-4">Wallet</th>
            <th className="p-4 text-right">Score</th>
            <th className="p-4 text-right">Slots</th>
            <th className="p-4 text-right">Reads</th>
            <th className="p-4 text-right">Last</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const rank = idx + 1;
            const badge = medalBadge(rank);
            return (
              <tr key={r.wallet} className={`border-t ${medalRowClass(rank)}`}>
                <td className="p-4 font-mono font-bold text-zinc-700 dark:text-zinc-200">
                  <div className="flex items-center gap-2">
                    <span>#{rank}</span>
                    {badge ? (
                      <span className={`text-[11px] font-black uppercase px-2 py-1 rounded-lg border ${badge.className}`}>
                        {badge.label}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="p-4">
                  <Tooltip content={r.wallet} side="top" align="start">
                    <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">{shortWallet(r.wallet)}</span>
                  </Tooltip>
                </td>
                <td className="p-4 text-right font-black text-zinc-900 dark:text-zinc-100">{r.totalScore.toLocaleString()}</td>
                <td className="p-4 text-right text-zinc-600 dark:text-zinc-300">{r.filledSlotsCount}</td>
                <td className="p-4 text-right text-zinc-600 dark:text-zinc-300">{r.confirmedReadsCount}</td>
                <td className="p-4 text-right text-zinc-500 dark:text-zinc-400 text-sm">
                  {r.lastActivityMs > 0 ? new Date(r.lastActivityMs).toLocaleDateString() : '-'}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td className="p-6 text-zinc-500" colSpan={6}>
                No leaderboard activity yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

