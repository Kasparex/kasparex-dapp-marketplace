'use client';

import Link from 'next/link';

/** Compact next-steps card for the games right rail (under Benefits). */
export function GamesNextStepsPanel({
  connected,
  yieldPerSecond,
  activeWorkers,
}: {
  connected: boolean;
  yieldPerSecond: number;
  activeWorkers: number;
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-zinc-700 dark:text-zinc-300">
      <h3 className="text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-200">Next steps</h3>
      <p className="mt-2 text-[12px] leading-snug">
        {connected ? (
          <>
            Deploy an NFT on your free starter Worker ({activeWorkers} mining at {yieldPerSecond.toFixed(2)} D/s), buy
            more slots to scale, refine from the Game Deck, then claim on{' '}
            <Link href="/rewards" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
              Rewards
            </Link>
            .
          </>
        ) : (
          <>
            Connect once to bind this browser profile to your wallet. Idle mining can continue afterward; refine to Hub
            before clearing browser data.
          </>
        )}
      </p>
    </div>
  );
}
