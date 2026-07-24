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
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300"
          >
            {c}
          </span>
        ))}
        {tags.map((t) => (
          <span
            key={t}
            className="rounded-lg border border-[color:var(--hub-accent-border,rgba(16,185,129,0.25))] bg-[color:var(--hub-accent-muted,rgba(16,185,129,0.1))] px-3 py-1.5 text-xs font-medium text-[color:var(--hub-accent,#10b981)]"
          >
            {t}
          </span>
        ))}
        {categories.length === 0 && tags.length === 0 ? (
          <span className="kx-body">No metadata.</span>
        ) : null}
      </div>
    </GamePanelCard>
  );
}
