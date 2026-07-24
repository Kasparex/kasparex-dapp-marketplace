'use client';

import type { ReactNode } from 'react';
import type { AdSlotId } from '@/lib/ads/types';
import { PanelAdSlider } from '@/components/ads/PanelAdSlider';

/**
 * Shared Hub right-rail stack for sticky Ad Slots across projects.
 * Full-height column so the ad sticks under the Hub header until main content ends.
 * Do not use mt-auto (parks the ad at the far bottom of the rail).
 */
export function HubAsideRail({
  children,
  adSlotId,
  adId,
  ad = true,
  className = '',
}: {
  children: ReactNode;
  /** When set (and ad is true), renders PanelAdSlider as the last rail item. */
  adSlotId?: AdSlotId;
  adId?: string;
  ad?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex h-full min-h-full w-full min-w-0 flex-col gap-4 ${className}`.trim()}>
      {children}
      {ad && adSlotId ? <PanelAdSlider slotId={adSlotId} id={adId} /> : null}
    </div>
  );
}
