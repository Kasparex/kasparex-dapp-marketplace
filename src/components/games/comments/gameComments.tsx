'use client';

import { useMemo } from 'react';
import { useDAppCommentsCount } from '@/hooks/useDAppCommentsCount';
import type { GameTab } from '@/components/games/layout/GameTabs';

export function gameCommentsArticleId(slugOrId: string) {
  return `game:${slugOrId}`;
}

export function GameCommentsTabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
      {count}
    </span>
  );
}

export function useGameCommentsTabs<T extends string>(
  tabs: readonly GameTab<T>[],
  articleSlug: string,
): GameTab<T>[] {
  const articleId = gameCommentsArticleId(articleSlug);
  const commentsCount = useDAppCommentsCount(articleId);
  return useMemo(
    () =>
      tabs.map((t) =>
        t.id === 'comments'
          ? { ...t, rightAdornment: <GameCommentsTabBadge count={commentsCount} /> }
          : t,
      ),
    [tabs, commentsCount],
  );
}
