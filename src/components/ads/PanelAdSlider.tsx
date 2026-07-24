'use client';

import type { AdSlotId } from '@/lib/ads/types';
import { AdSlider } from '@/components/ads/AdSlider';

/**
 * Standard 1:1 panel rail ad slot for right-column panels (dApps, vBlog, games, etc.).
 * Sticky so the Ad Slot stays in the viewport while the main column scrolls.
 * Halo headers use AdSlider directly and stay non-sticky.
 *
 * Sticky below the Hub header (h-16) so the Ad Slot does not sit under the menu.
 * Parent rail must stretch to the main column height (see HubPageRightPanelGrid)
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
    <div
      id={id}
      className={`w-full min-w-0 scroll-mt-28 self-start lg:sticky lg:top-20 lg:z-20 ${className}`.trim()}
    >
      <AdSlider slotId={slotId} variant="halo" relaxHaloFrame />
    </div>
  );
}
