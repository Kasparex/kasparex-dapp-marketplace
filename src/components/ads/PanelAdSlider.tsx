'use client';

import type { AdSlotId } from '@/lib/ads/types';
import { AdSlider } from '@/components/ads/AdSlider';

/**
 * Standard 1:1 panel rail ad slot for right-column panels (dApps, vBlog, games, etc.).
 * Sticky within the right sidebar so the Ad Slot stays visible while main content scrolls.
 * Halo headers use AdSlider directly and are not sticky.
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
      className={`scroll-mt-24 w-full min-w-0 lg:sticky lg:top-6 lg:z-10 self-start ${className}`.trim()}
    >
      <AdSlider slotId={slotId} variant="halo" relaxHaloFrame />
    </div>
  );
}
