'use client';

import { useDonationLeaderboard } from '@/hooks/useDonationLeaderboard';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { useChainId } from 'wagmi';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';

interface DonationLeaderboardProps {
  creatorAddress: string;
  limit?: number;
  /** When these change (e.g. after campaign refetch), leaderboard refetches. */
  donorCount?: bigint;
  raisedWei?: bigint;
}

export function DonationLeaderboard({ creatorAddress, limit = 20, donorCount, raisedWei }: DonationLeaderboardProps) {
  const chainId = useChainId();
  const explorerChainId = chainId || CROWDKAS_CHAIN_ID;
  const { leaderboard, isLoading, error } = useDonationLeaderboard(creatorAddress, limit, { donorCount, raisedWei });

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        Top {limit} donors
      </h3>
      <div className="p-4">
        {isLoading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        )}
        {!isLoading && error && (
          <p className="text-sm text-amber-600 dark:text-amber-400">Could not load donors. Try again later.</p>
        )}
        {!isLoading && !error && leaderboard.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No L2 donations yet.</p>
        )}
        {!isLoading && leaderboard.length > 0 && (
          <ul className="space-y-2">
            {leaderboard.map((entry, i) => (
              <li key={entry.donor} className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400 w-6">{i + 1}.</span>
                <a
                  href={getExplorerUrl(entry.donor, explorerChainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 truncate flex-1 mx-2 min-w-0"
                  title={entry.donor}
                >
                  {entry.donor.slice(0, 6)}...{entry.donor.slice(-4)}
                </a>
                <span className="font-medium text-zinc-900 dark:text-zinc-100 shrink-0">
                  {entry.formatted} iKAS
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
