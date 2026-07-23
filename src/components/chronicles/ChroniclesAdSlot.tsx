'use client';

import { AdSlider } from '@/components/ads/AdSlider';
import { PanelAdSlider } from '@/components/ads/PanelAdSlider';

/** Unified Chronicles ad slot (same pool as halo headers). */
export function ChroniclesAdSlot({
  layout = 'halo',
  className = '',
  id,
}: {
  /** `halo` matches ChroniclesHaloHeader; `rail` matches dApps/Games aside rails. */
  layout?: 'halo' | 'rail';
  className?: string;
  id?: string;
}) {
  if (layout === 'halo') {
    return (
      <div
        id={id}
        className={`hidden lg:flex items-center justify-center flex-shrink-0 relative w-[280px] min-h-[200px] scroll-mt-24 ${className}`.trim()}
      >
        <AdSlider slotId="HALO_CHRONICLES_RIGHT" />
      </div>
    );
  }

  return <PanelAdSlider slotId="HALO_CHRONICLES_RIGHT" id={id} className={className} />;
}
