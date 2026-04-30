'use client';

import type { AdSlotId } from '@/lib/ads/types';
import { AdPlacementGrid } from '@/components/ads/AdPlacementGrid';

interface AdSliderProps {
  slotId: AdSlotId;
  relaxHaloFrame?: boolean;
}

/** Halo placement: Diamond Veins–style grid of ad cells (replaces rotating slider). */
export function AdSlider({ slotId, relaxHaloFrame }: AdSliderProps) {
  return <AdPlacementGrid slotId={slotId} variant="halo" relaxHaloFrame={relaxHaloFrame} />;
}
