'use client';

import Link from 'next/link';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

/** Local-persistence warnings for every game play sidebar (Benefits-style panel). */
export function GamesSecurityPanel() {
  const accentDot = 'text-[color:var(--hub-accent,#10b981)]';

  return (
    <aside className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-zinc-200 bg-white p-3.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/60">
      <DAppSectionHeader title="Save & security" className="mb-2" />
      <h2 className="mb-2.5 text-sm font-bold leading-snug text-zinc-900 dark:text-zinc-100">
        Protect your progress
      </h2>
      <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
        <li>
          <span className={accentDot}>•</span> Browser cache clears wipe local game saves
        </li>
        <li>
          <span className={accentDot}>•</span> Refine to Hub on{' '}
          <Link href="/rewards" className="font-semibold text-emerald-700 underline dark:text-emerald-300">
            /rewards
          </Link>{' '}
          first
        </li>
        <li>
          <span className={accentDot}>•</span> Return with the same Kaspa wallet
        </li>
        <li>
          <span className={accentDot}>•</span> Never share seed phrases or keys
        </li>
      </ul>
    </aside>
  );
}
