'use client';

import Link from 'next/link';
import { GameSectionHeader } from '@/components/games/layout/GameSectionHeader';
import { CHRONICLES_PANEL } from '@/lib/chronicles/typography';

/** Local-persistence warnings for every game play sidebar (Chronicles-style panel). */
export function GamesSecurityPanel() {
  const accentDot = 'text-[color:var(--hub-accent,#10b981)]';
  const accentLink =
    'font-semibold text-[color:var(--hub-accent,#10b981)] hover:underline';

  return (
    <aside className={`w-full min-w-0 max-w-full ${CHRONICLES_PANEL} p-4`}>
      <GameSectionHeader title="Save & security" className="mb-3" />
      <h2 className="mb-2.5 text-sm font-bold leading-snug text-zinc-900 dark:text-zinc-100">
        Protect your progress
      </h2>
      <ul className="space-y-2.5 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        <li>
          <span className={accentDot}>•</span> Browser cache clears wipe local game saves
        </li>
        <li>
          <span className={accentDot}>•</span> Refine to Hub on{' '}
          <Link href="/rewards" className={accentLink}>
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
