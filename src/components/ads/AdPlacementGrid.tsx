'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EmptyVeinSlotFrame, EmptyVeinSlotPlusIcon } from '@/components/game/EmptyVeinSlotFrame';
import { useAdsRegistryContext } from '@/components/ads/AdsRegistryProvider';
import { getSlotConfig } from '@/lib/ads/slots';
import { filterActiveAdsForSlot } from '@/lib/ads/registryUtils';
import type { AdEntry, AdSlotId } from '@/lib/ads/types';
import { CreateAdWizard } from '@/components/ads/CreateAdWizard';
import { useCarouselAutoplay } from '@/hooks/useCarouselAutoplay';

export type AdPlacementVariant = 'halo' | 'footer' | 'sidebar';

function frameForVariant(v: AdPlacementVariant): string {
  if (v === 'footer') return 'aspect-[32/9] min-h-[72px] max-h-[88px] p-3';
  if (v === 'sidebar') return 'aspect-[3/2] min-h-[100px] p-4 w-full';
  return 'aspect-square min-w-0 max-w-[220px] mx-auto w-full p-4';
}

interface AdPlacementGridProps {
  slotId: AdSlotId;
  variant: AdPlacementVariant;
  maxCellsShown?: number;
}

export function AdPlacementGrid({ slotId, variant, maxCellsShown }: AdPlacementGridProps) {
  const { ads, refresh } = useAdsRegistryContext();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSlot, setWizardSlot] = useState<AdSlotId | null>(null);
  const [wizardIndex, setWizardIndex] = useState(0);

  const cfg = getSlotConfig(slotId);
  const maxAds = cfg?.maxAds ?? 1;
  const limit = Math.min(maxCellsShown ?? maxAds, maxAds);

  const slotAds = useMemo(() => filterActiveAdsForSlot(ads, slotId), [ads, slotId]);

  const byIndex = useMemo(() => {
    const m = new Map<number, AdEntry>();
    for (const a of slotAds) {
      const i = a.slotIndex ?? 0;
      if (!m.has(i)) m.set(i, a);
    }
    return m;
  }, [slotAds]);

  const openWizard = (cellIndex: number) => {
    const used = new Set(slotAds.map((a) => a.slotIndex ?? 0));
    if (used.size >= maxAds) return;
    let idx = cellIndex;
    if (used.has(idx)) {
      const firstFree = [...Array(maxAds).keys()].find((i) => !used.has(i));
      if (firstFree === undefined) return;
      idx = firstFree;
    }
    setWizardSlot(slotId);
    setWizardIndex(idx);
    setWizardOpen(true);
  };

  const full = slotAds.length >= maxAds;
  const cells = Array.from({ length: limit }, (_, i) => i);
  const showNav = limit > 1;
  const { slide, setSlide, pauseOnHover } = useCarouselAutoplay(limit, 5200);

  return (
    <>
      <div className="relative w-full" {...pauseOnHover}>
        <div
          className={`overflow-hidden bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 ${
            variant === 'halo' ? 'rounded-2xl' : 'rounded-xl'
          }`}
        >
          <div
            className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${slide * 100}%)` }}
          >
            {cells.map((cellIndex) => {
              const ad = byIndex.get(cellIndex);
              return (
                <div
                  key={cellIndex}
                  className="w-full min-w-0 flex-shrink-0 flex justify-center items-stretch px-0.5"
                >
                  {ad ? (
                    <FilledAdCell ad={ad} variant={variant} />
                  ) : (
                    <EmptyVeinSlotFrame
                      disabled={full}
                      onClick={() => !full && openWizard(cellIndex)}
                      frameClassName={frameForVariant(variant)}
                    >
                      <div className="flex flex-col items-center gap-2 text-center relative z-[1]">
                        <EmptyVeinSlotPlusIcon />
                        <div>
                          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide text-xs sm:text-sm">
                            Ad slot
                          </h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs mt-0.5 px-1">
                            {full ? 'Slot full' : 'Your campaign'}
                          </p>
                        </div>
                      </div>
                    </EmptyVeinSlotFrame>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {showNav && (
          <>
            <button
              type="button"
              aria-label="Previous ad slot"
              onClick={() => setSlide((s) => (s - 1 + limit) % limit)}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 h-8 w-8 ml-0.5 rounded-full border border-zinc-200/90 bg-white/90 text-zinc-700 shadow-sm backdrop-blur-sm hover:bg-white hover:border-[#02abb8]/40 hover:text-[#02abb8] disabled:pointer-events-none disabled:opacity-25 dark:border-zinc-600 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:border-[#02abb8]/50"
            >
              <svg className="mx-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next ad slot"
              onClick={() => setSlide((s) => (s + 1) % limit)}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 h-8 w-8 mr-0.5 rounded-full border border-zinc-200/90 bg-white/90 text-zinc-700 shadow-sm backdrop-blur-sm hover:bg-white hover:border-[#02abb8]/40 hover:text-[#02abb8] disabled:pointer-events-none disabled:opacity-25 dark:border-zinc-600 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:border-[#02abb8]/50"
            >
              <svg className="mx-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="flex items-center gap-1.5">
                {cells.map((i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Ad slot ${i + 1} of ${limit}`}
                    aria-current={slide === i ? 'true' : undefined}
                    onClick={() => setSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      slide === i
                        ? 'w-5 bg-[#02abb8]'
                        : 'w-1.5 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
                {slide + 1}/{limit}
              </span>
            </div>
          </>
        )}
      </div>
      {wizardSlot ? (
        <CreateAdWizard
          isOpen={wizardOpen}
          onClose={() => {
            setWizardOpen(false);
            setWizardSlot(null);
          }}
          onSuccess={() => void refresh({ silent: true })}
          initialSlotId={wizardSlot}
          initialSlotIndex={wizardIndex}
        />
      ) : null}
    </>
  );
}

function FilledAdCell({ ad, variant }: { ad: AdEntry; variant: AdPlacementVariant }) {
  const cls =
    variant === 'footer'
      ? 'relative block w-full aspect-[32/9] min-h-[72px] max-h-[88px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-900'
      : variant === 'sidebar'
        ? 'relative block w-full aspect-[3/2] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-900'
        : 'relative block w-full aspect-square max-w-[220px] mx-auto rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-900';

  return (
    <Link href={ad.link} target="_blank" rel="noopener noreferrer sponsored" className={cls} title={ad.title}>
      <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" sizes="240px" unoptimized />
    </Link>
  );
}
