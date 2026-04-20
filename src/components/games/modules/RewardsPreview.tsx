'use client';

import Link from 'next/link';
import { useWalletDeck } from '@/hooks/useWalletDeck';

export function RewardsPreview(props: { compact?: boolean }) {
  const { data, isLoading } = useWalletDeck();

  const pendingGrid = data?.rewards?.pendingGrid ?? 0;
  const diamonds = data?.diamonds?.balance ?? 0;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Your rewards</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Unified deck</div>
        </div>
        <Link
          href="/tiers"
          className="text-xs font-medium text-[#02abb8] hover:text-[#028a94] transition-colors"
        >
          Open deck →
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Pending GRID</div>
          <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {isLoading ? '…' : pendingGrid.toFixed(2)}
          </div>
        </div>
        <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Diamonds</div>
          <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{isLoading ? '…' : diamonds}</div>
        </div>
      </div>
    </div>
  );
}

