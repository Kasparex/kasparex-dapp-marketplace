'use client';

import type { ReactNode } from 'react';
import { useGamesMainAdaptiveGrid, type GamesMainAdaptiveGridOpts } from './GamesLayoutContext';

type Props = { children: ReactNode } & GamesMainAdaptiveGridOpts;

/**
 * Responsive games grid: column count follows the deck panel. Must render under GamesLayoutProvider.
 * Prefer this over useGamesMainAdaptiveGrid in parents that wrap GamesWithSidebarLayout (context would be missing).
 */
export function GamesAdaptiveGrid({ children, gapClass, className }: Props) {
  const gridClass = useGamesMainAdaptiveGrid({ gapClass, className });
  return <div className={`min-w-0 ${gridClass}`}>{children}</div>;
}
