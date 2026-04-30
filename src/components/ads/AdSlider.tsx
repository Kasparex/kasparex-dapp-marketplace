'use client';

import type { AdSlotId } from '@/lib/ads/types';
import { AdPlacementGrid } from '@/components/ads/AdPlacementGrid';

interface AdSliderProps {
  slotId: AdSlotId;
  relaxHaloFrame?: boolean;
  /**
   * Narrow aside columns (profile sidebar, vBlog article rail) use `sidebar` framing.
   * Defaults by slot: `VBLOG_ARTICLE_ASIDE_BOTTOM`, `SIDEBAR_RANDOM` → sidebar; halos → halo.
   */
  variant?: 'halo' | 'sidebar';
}

function defaultPlacementVariant(slotId: AdSlotId): 'halo' | 'sidebar' {
  if (slotId === 'VBLOG_ARTICLE_ASIDE_BOTTOM' || slotId === 'SIDEBAR_RANDOM') return 'sidebar';
  return 'halo';
}

/** Hero halos + sidebar rails: carousel grid of ad cells. */
export function AdSlider({ slotId, relaxHaloFrame, variant }: AdSliderProps) {
  const v = variant ?? defaultPlacementVariant(slotId);
  return (
    <AdPlacementGrid slotId={slotId} variant={v} relaxHaloFrame={v === 'halo' ? relaxHaloFrame : false} />
  );
}
