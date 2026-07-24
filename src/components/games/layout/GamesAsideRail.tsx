'use client';

import type { ReactNode } from 'react';
import { AdSlider } from '@/components/ads/AdSlider';

/**
 * Games right-rail stack: Chronicles-style spacing, full-height column so the Ad Slot can stick.
 * Sticky must be a direct child of this tall column (not nested in a short wrapper).
 */
export function GamesAsideRail({ children, ad = true }: { children: ReactNode; ad?: boolean }) {
  return (
    <div className="flex h-full min-h-full w-full min-w-0 flex-col gap-4">
      <div className="flex w-full min-w-0 flex-col gap-4">{children}</div>
      {ad ? (
        <div
          id="ad-slot-games-play-rail"
          className="mt-auto w-full min-w-0 scroll-mt-24 pt-2 lg:sticky lg:top-6 lg:z-20"
        >
          <AdSlider slotId="HALO_GAMES_RIGHT" variant="halo" relaxHaloFrame />
        </div>
      ) : null}
    </div>
  );
}
