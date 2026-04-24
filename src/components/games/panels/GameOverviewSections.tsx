'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';

export function GameOverviewSections(props: {
  gameName: string;
  description?: string;
  loreStory?: string;
  flow?: string[];
}) {
  const flow = props.flow ?? [];
  return (
    <div className="space-y-6">
      <GamePanelCard title="Story description" hint="What this game is about.">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {props.description?.trim() ? props.description : '—'}
        </p>
      </GamePanelCard>

      <GamePanelCard title="Game flow" hint="Core loop at a glance.">
        {flow.length > 0 ? (
          <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
            {flow.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">—</p>
        )}
      </GamePanelCard>

      <GamePanelCard title="Game info" hint="Links and mechanics.">
        <ul className="space-y-0">
          <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Game</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{props.gameName}</span>
          </li>
          <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Rewards</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Claim later via Rewards &amp; Points</span>
          </li>
          <li className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Network</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Kaspa (L1) + Kasplex (L2)</span>
          </li>
        </ul>
      </GamePanelCard>

      {props.loreStory?.trim() ? (
        <GamePanelCard title="Story" hint="Lore excerpt.">
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{props.loreStory}</p>
        </GamePanelCard>
      ) : null}
    </div>
  );
}

