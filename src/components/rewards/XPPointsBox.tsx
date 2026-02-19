'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { getMockWalletHoldings } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';

export function XPPointsBox() {
  const { address, isConnected } = useAccount();
  const { totalPoints, streakDays, isLoading } = useLoyaltyPoints();
  const mockHoldings = isConnected && address ? getMockWalletHoldings(address) : null;
  const points = totalPoints > 0 ? totalPoints : (mockHoldings?.xp ?? 0);

  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        XP Points
      </h3>
      
      {!isConnected ? (
        <div className="text-center py-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            Connect wallet to view XP
          </p>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">
            Earn points through dApp usage
          </div>
          <Link
            href="/points"
            className="inline-block px-3 py-1.5 text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            View Perks
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Current Balance
            </span>
            <span className="text-xl font-bold text-[#02abb8]">
              {isLoading ? '...' : formatLargeNumber(points)}
            </span>
          </div>
          {streakDays > 0 && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Streak: {streakDays} day{streakDays !== 1 ? 's' : ''}
            </div>
          )}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            Earn points on every on-chain transaction
          </div>
          <Link
            href="/points"
            className="block w-full mt-3 px-3 py-2 text-xs font-medium text-center bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            View All Perks
          </Link>
        </div>
      )}
    </div>
  );
}

