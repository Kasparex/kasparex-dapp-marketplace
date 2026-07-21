'use client';

import { AdSlider } from '@/components/ads/AdSlider';
import type { AdSlotId } from '@/lib/ads/types';
import { HUB_HALO_DESKTOP_ONLY } from '@/lib/hub/haloHeaders';

/**
 * Standardized Hub dashboard page header:
 * kicker, tilt title, excerpt, optional project Ad Slot (same as listing halo).
 * Do not render wallet addresses under the excerpt.
 */
export function HubDashboardPageHeader(props: {
  kicker: string;
  title: string;
  titleAccent: string;
  excerpt?: string;
  /** Project halo ad slot (e.g. HALO_DAPPS_RIGHT). */
  adSlotId?: AdSlotId;
  adSlotDomId?: string;
  /** Tiny label on the decorative ad frame (e.g. dApp, Game). */
  adFrameLabel?: string;
  className?: string;
}) {
  const {
    kicker,
    title,
    titleAccent,
    excerpt,
    adSlotId,
    adSlotDomId,
    adFrameLabel = 'Ad',
    className = '',
  } = props;

  const textBlock = (
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
  );

  if (!adSlotId) {
    return <div className={`mb-8 ${className}`.trim()}>{textBlock}</div>;
  }

  return (
    <div className={`mb-8 ${className}`.trim()}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {textBlock}
        <div className={`relative hidden w-[280px] flex-shrink-0 items-center justify-center lg:flex ${HUB_HALO_DESKTOP_ONLY}`}>
          <div className="pointer-events-none relative opacity-90">
            <div className="h-56 w-48 rotate-3 transform rounded-2xl border-2 border-[color:var(--hub-accent-border,rgba(6,182,212,0.3))] bg-white/80 shadow-2xl shadow-[color:var(--hub-accent-shadow,rgba(6,182,212,0.1))] dark:bg-zinc-900/80" />
            <div className="absolute -bottom-2 -right-2 h-48 w-40 -rotate-6 transform rounded-xl border-2 border-zinc-300/40 bg-zinc-100/90 shadow-xl dark:border-zinc-700/40 dark:bg-zinc-800/90" />
            <div className="absolute bottom-4 left-4 right-4 top-4 flex items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700/50">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {adFrameLabel}
              </span>
            </div>
          </div>
          <div
            id={adSlotDomId}
            className="pointer-events-auto absolute inset-0 flex scroll-mt-24 flex-col items-center justify-center"
          >
            <AdSlider slotId={adSlotId} />
          </div>
        </div>
      </div>
    </div>
  );
}
