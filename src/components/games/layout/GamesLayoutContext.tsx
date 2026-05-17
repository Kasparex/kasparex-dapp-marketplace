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

/** Stat / mining cards: 1 col phones, 2 from sm; narrow main tops at 2 from lg; full-width adds a third column from md+. */
export type GamesMainAdaptiveGridOpts = {
  gapClass?: string;
  /** Extra Tailwind utilities appended to the grid class string. */
  className?: string;
};

export function useGamesMainAdaptiveGrid(opts?: GamesMainAdaptiveGridOpts) {
  const { rightPanelOpen } = useGamesLayoutDensity();
  const gap = opts?.gapClass ?? 'gap-4';
  const tail = opts?.className?.trim();
  const extra = tail ? ` ${tail}` : '';
  // Narrow main (deck open): 2 cols from lg+. Full-width main (deck hidden): 3 cols from md+.
  const layout = rightPanelOpen
    ? `grid grid-cols-1 ${gap} sm:grid-cols-2 lg:grid-cols-2`
    : `grid grid-cols-1 ${gap} sm:grid-cols-2 md:grid-cols-3`;
  return `${layout}${extra}`;
}

/** Shop / wider cards: md two columns early; third column at lg when sidebar hidden (full-width main). */
export function useGamesMainAdaptiveWideGrid(gapClass: string | undefined = 'gap-6') {
  const { rightPanelOpen } = useGamesLayoutDensity();
  if (rightPanelOpen) return `grid grid-cols-1 ${gapClass} md:grid-cols-2 lg:grid-cols-2`;
  return `grid grid-cols-1 ${gapClass} md:grid-cols-2 lg:grid-cols-3`;
}

/** Crew / Workers NFT slot tiles: 3 columns with deck panel open, 4 when main is full width. */
export function useGamesNftSlotsAdaptiveGrid(gapClass: string | undefined = 'gap-6') {
  const { rightPanelOpen } = useGamesLayoutDensity();
  const gap = gapClass ?? 'gap-6';
  if (rightPanelOpen) {
    return `grid grid-cols-1 ${gap} sm:grid-cols-2 lg:grid-cols-3`;
  }
  return `grid grid-cols-1 ${gap} sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`;
}
