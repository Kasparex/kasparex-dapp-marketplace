'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';

export function GameMetadataPanel(props: { categories?: string[]; tags?: string[] }) {
  const categories = props.categories ?? [];
  const tags = props.tags ?? [];
  return (
    <GamePanelCard title="Metadata" hint="Game category and tags.">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <span
            key={c}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          >
            {c}
          </span>
        ))}
        {tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200"
          >
            {t}
          </span>
        ))}
        {categories.length === 0 && tags.length === 0 ? (
          <span className="text-sm text-zinc-600 dark:text-zinc-400">No metadata.</span>
        ) : null}
      </div>
    </GamePanelCard>
  );
}

