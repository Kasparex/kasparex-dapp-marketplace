'use client';

import { AdSlider } from '@/components/ads/AdSlider';
import type { AdSlotId } from '@/lib/ads/types';

/**
 * Standardized Hub dashboard page header:
 * kicker, tilt title, excerpt, optional project Ad Slot (same slot as listing halo).
 * Do not render wallet addresses under the excerpt.
 * Ad slot: no decorative frames under it; vertically centered.
 */
export function HubDashboardPageHeader(props: {
  kicker: string;
  title: string;
  titleAccent: string;
  excerpt?: string;
  adSlotId?: AdSlotId;
  adSlotDomId?: string;
  className?: string;
}) {
  const { kicker, title, titleAccent, excerpt, adSlotId, adSlotDomId, className = '' } = props;

  return (
    <div className={`mb-8 ${className}`.trim()}>
      <div className={`flex flex-col gap-6 ${adSlotId ? 'lg:flex-row lg:items-center lg:justify-between' : ''}`}>
        <div className="min-w-0 max-w-2xl flex-1">
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-[color:var(--hub-accent,#02abb8)]">
            {kicker}
          </p>
          <div className="mb-2 flex items-center gap-3">
            <span className="hub-tilt-bar h-7 w-1.5 shrink-0 rounded-full" aria-hidden="true" />
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              {title}{' '}
              <span className="text-[color:var(--hub-accent,#02abb8)]">{titleAccent}</span>
            </h1>
          </div>
          {excerpt ? <p className="kx-body max-w-3xl">{excerpt}</p> : null}
        </div>

        {adSlotId ? (
          <div
            id={adSlotDomId}
            className="hidden w-full shrink-0 items-center justify-center self-center lg:flex lg:w-[280px]"
          >
            <AdSlider slotId={adSlotId} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
