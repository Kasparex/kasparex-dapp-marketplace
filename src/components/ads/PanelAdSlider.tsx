'use client';

import type { AdSlotId } from '@/lib/ads/types';
import { AdSlider } from '@/components/ads/AdSlider';

/**
 * Standard 1:1 panel rail ad slot for right-column panels (dApps, vBlog, games, etc.).
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
    <div id={id} className={`scroll-mt-24 ${className}`.trim()}>
      <AdSlider slotId={slotId} variant="halo" relaxHaloFrame />
    </div>
  );
}
