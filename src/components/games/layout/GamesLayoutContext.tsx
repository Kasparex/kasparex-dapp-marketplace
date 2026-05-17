'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type GamesLayoutDensity = {
  /** When true, main column sits beside the sidebar (narrower content area). */
  rightPanelOpen: boolean;
};

const GamesLayoutContext = createContext<GamesLayoutDensity | null>(null);

export function GamesLayoutProvider(props: GamesLayoutDensity & { children: ReactNode }) {
  const { children, ...density } = props;
  return <GamesLayoutContext.Provider value={density}>{children}</GamesLayoutContext.Provider>;
}

export function useGamesLayoutDensity(): GamesLayoutDensity {
  const ctx = useContext(GamesLayoutContext);
  return ctx ?? { rightPanelOpen: true };
}

/** Stat / mining cards: 1 col phones, 2 from sm up, then 2 vs 3 at lg with sidebar vs full-width main. */
export type GamesMainAdaptiveGridOpts = {
  gapClass?: string;
  /** Extra Tailwind utilities appended to the grid class string. */
  className?: string;
};

export function useGamesMainAdaptiveGrid(opts?: GamesMainAdaptiveGridOpts) {
  const { rightPanelOpen } = useGamesLayoutDensity();
  const lgCols = rightPanelOpen ? 'lg:grid-cols-2' : 'lg:grid-cols-3';
  const gap = opts?.gapClass ?? 'gap-4';
  const tail = opts?.className?.trim();
  const extra = tail ? ` ${tail}` : '';
  return `grid grid-cols-1 ${gap} sm:grid-cols-2 ${lgCols}${extra}`;
}

/** Shop / wider cards: md two columns early; third column only when sidebar hidden. */
export function useGamesMainAdaptiveWideGrid(gapClass: string | undefined = 'gap-6') {
  const { rightPanelOpen } = useGamesLayoutDensity();
  if (rightPanelOpen) return `grid grid-cols-1 ${gapClass} md:grid-cols-2 lg:grid-cols-2`;
  return `grid grid-cols-1 ${gapClass} md:grid-cols-2 xl:grid-cols-3`;
}
