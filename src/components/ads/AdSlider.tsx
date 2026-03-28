'use client';

import type { AdSlotId } from '@/lib/ads/types';
import { AdPlacementGrid } from '@/components/ads/AdPlacementGrid';

interface AdSliderProps {
  slotId: AdSlotId;
}

/** Halo placement: Diamond Veins–style grid of ad cells (replaces rotating slider). */
export function AdSlider({ slotId }: AdSliderProps) {
  return <AdPlacementGrid slotId={slotId} variant="halo" />;
}
