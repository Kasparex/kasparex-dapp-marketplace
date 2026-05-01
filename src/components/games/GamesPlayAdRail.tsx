'use client';

import { AdSlider } from '@/components/ads/AdSlider';

/**
 * Right-column ads on game dashboards - shares the same slot pool as the Kasparex Games halo
 * (`HALO_GAMES_RIGHT`). Sticky within the column while scrolling so creatives stay in view longer.
 */
export function GamesPlayAdRail() {
  return (
    <div
      id="ad-slot-games-play-rail"
      className="scroll-mt-4 w-full min-w-0 max-w-full lg:sticky lg:top-24 lg:z-20 lg:self-start"
    >
      <div className="mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-2 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <AdSlider slotId="HALO_GAMES_RIGHT" relaxHaloFrame />
      </div>
    </div>
  );
}
