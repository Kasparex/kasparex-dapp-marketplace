'use client';

import Link from 'next/link';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { Tooltip } from '@/components/ui/Tooltip';

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
        {interactions.map((c) => (
          <li key={`${c.title}-${c.toHref ?? c.toSlug ?? 'x'}`} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <Tooltip
              content={[
                c.punch,
                c.requirement ? `Requirement: ${c.requirement}` : null,
              ]
                .filter(Boolean)
                .join('\n')}
            >
              <Link
                href={c.toHref ?? (c.toSlug ? `/games/${c.toSlug}` : '/games')}
                className={[
                  'block py-2.5 px-3 transition-colors rounded-lg',
                  'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                ].join(' ')}
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{c.title}</p>
              </Link>
            </Tooltip>
          </li>
        ))}
      </ul>
    </GamePanelCard>
  );
}

