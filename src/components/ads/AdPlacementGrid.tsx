'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EmptyVeinSlotPlusIcon } from '@/components/game/EmptyVeinSlotFrame';
import { useAdsRegistryContext } from '@/components/ads/AdsRegistryProvider';
import { getSlotConfig } from '@/lib/ads/slots';
import { filterActiveAdsForSlot } from '@/lib/ads/registryUtils';
import type { AdEntry, AdSlotId } from '@/lib/ads/types';
import { CreateAdWizard } from '@/components/ads/CreateAdWizard';
import { useCarouselAutoplay } from '@/hooks/useCarouselAutoplay';

export type AdPlacementVariant = 'halo' | 'footer' | 'sidebar';

/** One outer frame per slide: aspect + padding inside the dashed/solid shell */
function frameForVariant(v: AdPlacementVariant): string {
  if (v === 'footer') {
    return 'aspect-[32/10] min-h-[88px] max-h-[108px] w-full p-2 sm:p-3';
  }
  if (v === 'sidebar') return 'aspect-[3/2] min-h-[100px] w-full p-3 sm:p-4';
  return 'aspect-square min-w-0 max-w-[220px] mx-auto w-full p-3 sm:p-4';
}

const CAROUSEL_INTERVAL_MS = 4000;

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

  const occupiedIndices = useMemo(() => new Set(slotAds.map((a) => a.slotIndex ?? 0)), [slotAds]);
  const full = occupiedIndices.size >= maxAds;

  const openWizard = (cellIndex: number) => {
    if (full) return;
    const used = occupiedIndices;
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

  const cells = Array.from({ length: limit }, (_, i) => i);
  const showNav = limit > 1;
  const { slide, setSlide, pauseOnHover } = useCarouselAutoplay(
    limit,
    CAROUSEL_INTERVAL_MS,
    true
  );

  const rounded = variant === 'halo' ? 'rounded-2xl' : 'rounded-xl';

  return (
    <>
      <div className="relative w-full">
        <div className={`overflow-hidden ${rounded}`} {...pauseOnHover}>
          <div
            className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${slide * 100}%)` }}
          >
            {cells.map((cellIndex) => {
              const ad = byIndex.get(cellIndex);
              const frame = frameForVariant(variant);
              return (
                <div key={cellIndex} className="w-full min-w-0 flex-shrink-0 flex justify-center items-stretch px-1">
                  {ad ? (
                    <FilledAdShell ad={ad} frameClassName={frame} rounded={rounded} />
                  ) : (
                    <button
                      type="button"
                      disabled={full}
                      onClick={() => openWizard(cellIndex)}
                      className={`${frame} ${rounded} relative flex w-full flex-col items-center justify-center overflow-hidden border-2 border-dashed border-zinc-300 bg-zinc-100 text-center transition-all dark:border-zinc-600 dark:bg-zinc-900 ${
                        full
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer hover:border-emerald-500/50 group'
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="relative z-[1] flex flex-col items-center gap-2">
                        <EmptyVeinSlotPlusIcon />
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300 sm:text-sm">
                            Ad slot
                          </h3>
                          <p className="mt-0.5 px-1 text-[11px] text-zinc-500 dark:text-zinc-400 sm:text-xs">
                            {full ? 'Slot full' : 'Your campaign'}
                          </p>
                        </div>
                      </div>
                    </button>
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
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 h-8 w-8 ml-0.5 rounded-full border border-zinc-200/90 bg-white/90 text-zinc-700 shadow-sm backdrop-blur-sm hover:bg-white hover:border-[#02abb8]/40 hover:text-[#02abb8] dark:border-zinc-600 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:border-[#02abb8]/50"
            >
              <svg className="mx-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next ad slot"
              onClick={() => setSlide((s) => (s + 1) % limit)}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 h-8 w-8 mr-0.5 rounded-full border border-zinc-200/90 bg-white/90 text-zinc-700 shadow-sm backdrop-blur-sm hover:bg-white hover:border-[#02abb8]/40 hover:text-[#02abb8] dark:border-zinc-600 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:border-[#02abb8]/50"
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

function FilledAdShell({
  ad,
  frameClassName,
  rounded,
}: {
  ad: AdEntry;
  frameClassName: string;
  rounded: string;
}) {
  return (
    <Link
      href={ad.link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      title={ad.title}
      className={`${frameClassName} ${rounded} relative block w-full overflow-hidden bg-zinc-100 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700`}
    >
      <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" sizes="240px" unoptimized />
    </Link>
  );
}
