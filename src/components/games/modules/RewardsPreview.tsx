'use client';

import Link from 'next/link';
import { useWalletDeck } from '@/hooks/useWalletDeck';

export function RewardsPreview(props: { showLink?: boolean; className?: string }) {
  const { data, isLoading, isFetching, refetch } = useWalletDeck();

  const pendingGrid = data?.rewards?.pendingGrid ?? 0;
  const diamonds = data?.diamonds?.balance ?? 0;
  const showLink = Boolean(props.showLink);

  return (
    <div className={['rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60', props.className ?? ''].join(' ')}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Your rewards</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-500">Unified deck</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-60 dark:text-emerald-400"
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
          {showLink ? (
            <Link href="/tiers" className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
              Open deck
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-500">Pending GRID</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{isLoading ? '…' : pendingGrid.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-500">Diamonds</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{isLoading ? '…' : diamonds.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

