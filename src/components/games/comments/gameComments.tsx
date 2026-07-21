'use client';

import type { GameTab } from '@/components/games/layout/GameTabs';

export function gameCommentsArticleId(slugOrId: string) {
  return `game:${slugOrId}`;
}

/** Pass-through helper kept for call-site compatibility (no on-tab badges). */
export function useGameCommentsTabs<T extends string>(
  tabs: readonly GameTab<T>[],
  _articleSlug: string,
): GameTab<T>[] {
  return tabs as GameTab<T>[];
}
