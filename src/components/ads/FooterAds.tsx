'use client';

import { AdPlacementGrid } from '@/components/ads/AdPlacementGrid';
import { AdSlotColumn } from '@/components/ads/AdSlotColumn';

export function FooterAds() {
  return (
    <AdSlotColumn>
      <AdPlacementGrid slotId="FOOTER_BLOCK" variant="footer" />
    </AdSlotColumn>
  );
}
