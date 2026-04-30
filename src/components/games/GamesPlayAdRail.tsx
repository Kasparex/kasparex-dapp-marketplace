'use client';

import { AdSlider } from '@/components/ads/AdSlider';

/**
 * Right-column ads on game dashboards — shares the same slot pool as the Kasparex Games halo
 * (`HALO_GAMES_RIGHT`). Sticky within the column while scrolling so creatives stay in view longer.
 */
export function GamesPlayAdRail() {
  return (
    <div id="ad-slot-games-play-rail" className="scroll-mt-4 lg:sticky lg:top-20 lg:z-20 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <AdSlider slotId="HALO_GAMES_RIGHT" relaxHaloFrame />
      </div>
    </div>
  );
}
