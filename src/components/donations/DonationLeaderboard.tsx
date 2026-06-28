'use client';

import { useDonationLeaderboard } from '@/hooks/useDonationLeaderboard';
import { getExplorerTxUrlForChain, getExplorerUrl } from '@/lib/dapps/deployer';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';

interface DonationLeaderboardProps {
  creatorAddress: string;
  limit?: number;
  donorCount?: bigint;
  raisedWei?: bigint;
  campaignId?: bigint;
}

export function DonationLeaderboard({ creatorAddress, limit = 20, donorCount, raisedWei, campaignId }: DonationLeaderboardProps) {
  const { latestDonations, isLoading, error } = useDonationLeaderboard(creatorAddress, limit, { donorCount, raisedWei, campaignId });

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        Latest {limit} donations
      </h3>
      <div className="p-4">
        {isLoading && <p className="kx-body">Loading…</p>}
        {!isLoading && error && (
          <p className="text-sm text-amber-600 dark:text-amber-400">Could not load donations. Try again later.</p>
        )}
        {!isLoading && !error && latestDonations.length === 0 && (
          <p className="kx-body">No donations recorded yet.</p>
        )}
        {!isLoading && latestDonations.length > 0 && (
          <ul className="space-y-3">
            {latestDonations.map((entry, i) => (
              <li key={`${entry.txHash}-${entry.logIndex}-${i}`} className="text-sm border-b border-zinc-100 dark:border-zinc-800/80 pb-3 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-zinc-400 dark:text-zinc-500 w-6 shrink-0">{i + 1}.</span>
                  <a
                    href={getExplorerUrl(entry.donor, CROWDKAS_CHAIN_ID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-zinc-800 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 truncate min-w-0"
                    title={entry.donor}
                  >
                    {entry.donor.slice(0, 6)}…{entry.donor.slice(-4)}
                  </a>
                  <span className="text-zinc-500 dark:text-zinc-400 shrink-0">·</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 shrink-0">{entry.formattedAmount} iKAS</span>
                </div>
                <a
                  href={getExplorerTxUrlForChain(CROWDKAS_CHAIN_ID, entry.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 ml-8 inline-block font-mono text-xs text-emerald-700 dark:text-emerald-400 hover:underline truncate max-w-full"
                  title={entry.txHash}
                >
                  Tx {entry.txHash.slice(0, 10)}…{entry.txHash.slice(-6)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
