'use client';

import { AdSlider } from '@/components/ads/AdSlider';

/** Bottom-of-right-column ad placement on game dashboards (Minecore, Diamond Veins, etc.). */
export function GamesPlayAdRail() {
  return (
    <div id="ad-slot-games-play-rail" className="scroll-mt-4">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/50">
        <AdSlider slotId="GAMES_PLAY_RAIL_RIGHT" />
      </div>
    </div>
  );
}
