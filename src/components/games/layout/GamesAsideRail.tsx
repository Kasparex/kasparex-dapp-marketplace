'use client';

import type { ReactNode } from 'react';
import { HubAsideRail } from '@/components/hub/HubAsideRail';

/** Games right-rail: HubAsideRail + HALO_GAMES_RIGHT sticky Ad Slot. */
export function GamesAsideRail({ children, ad = true }: { children: ReactNode; ad?: boolean }) {
  return (
    <HubAsideRail ad={ad} adSlotId="HALO_GAMES_RIGHT" adId="ad-slot-games-play-rail">
      {children}
    </HubAsideRail>
  );
}
