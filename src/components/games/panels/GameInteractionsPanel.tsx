'use client';

import Link from 'next/link';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';

export type GameInteraction = {
  title: string;
  punch: string;
  toSlug?: string;
  toHref?: string;
  requirement?: string;
};

export function GameInteractionsPanel(props: { interactions?: GameInteraction[]; title?: string }) {
  const interactions = props.interactions ?? [];
  if (interactions.length === 0) return null;
  return (
    <GamePanelCard title={props.title ?? 'Interactions'} hint="Helpful actions and shortcuts.">
      <ul className="space-y-0">
        {interactions.map((c, idx) => (
          <li key={`${c.title}-${c.toHref ?? c.toSlug ?? 'x'}`} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <Link
              href={c.toHref ?? (c.toSlug ? `/games/${c.toSlug}` : '/games')}
              className={[
                'block py-2.5 transition-colors rounded-lg px-2 -mx-2',
                'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{c.title}</p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{c.punch}</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Open</span>
              </div>
              {c.requirement ? (
                <p className="mt-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Requirement: {c.requirement}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </GamePanelCard>
  );
}

