'use client';

import type { ReactNode } from 'react';
import { PanelAdSlider } from '@/components/ads/PanelAdSlider';

/**
 * Games right-rail stack: panels in document order, then sticky Ad Slot as the last item.
 * Parent stretches with the main column so sticky lasts until the tab content ends.
 * Do not use mt-auto (that parks the ad at the far bottom of the rail).
 */
export function GamesAsideRail({ children, ad = true }: { children: ReactNode; ad?: boolean }) {
  return (
    <div className="flex h-full min-h-full w-full min-w-0 flex-col gap-4">
      {children}
      {ad ? <PanelAdSlider slotId="HALO_GAMES_RIGHT" id="ad-slot-games-play-rail" /> : null}
    </div>
  );
}
