'use client';

import Link from 'next/link';

/** Short local-persistence warnings for every game play sidebar. */
export function GamesSecurityPanel() {
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-200">
        Save & security
      </h3>
      <ul className="mt-2 space-y-1.5 text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
        <li>
          Progress is stored in this browser per wallet. Clearing site data, cache, or history can wipe Diamonds and
          points.
        </li>
        <li>
          Refine to Hub and redeem on{' '}
          <Link href="/rewards" className="font-semibold text-emerald-700 underline dark:text-emerald-300">
            /rewards
          </Link>{' '}
          before clearing browser data.
        </li>
        <li>Use the same Kaspa wallet when you return so your local profile loads again.</li>
        <li>Never share seed phrases or private keys. Kasparex never asks for them.</li>
      </ul>
    </div>
  );
}
