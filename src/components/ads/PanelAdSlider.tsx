'use client';

import type { AdSlotId } from '@/lib/ads/types';
import { AdSlider } from '@/components/ads/AdSlider';

/** Sticky offset clears sticky Hub Header (h-16) with a little breathing room. */
export const HUB_PANEL_AD_STICKY_CLASS =
  'w-full min-w-0 scroll-mt-28 self-start lg:sticky lg:top-20 lg:z-20';

/**
 * Standard 1:1 panel rail ad slot for right-column panels (dApps, vBlog, games, etc.).
 * Sticky so the Ad Slot stays in the viewport while the main column scrolls.
 * Halo headers use AdSlider directly and stay non-sticky.
 *
 * Parent rail must stretch to the main column height (see HubAsideRail / HubPageRightPanelGrid)
 * and must not use overflow:hidden on ancestors.
 */
export function PanelAdSlider({
  slotId,
  id,
  className = '',
}: {
  slotId: AdSlotId;
  id?: string;
  className?: string;
}) {
  return (
    <div id={id} className={`${className} ${HUB_PANEL_AD_STICKY_CLASS}`.trim()}>
      <AdSlider slotId={slotId} variant="halo" relaxHaloFrame />
    </div>
  );
}
