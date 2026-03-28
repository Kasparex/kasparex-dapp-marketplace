'use client';

import type { AdEntry } from '@/lib/ads/types';
import { AdCard } from '@/components/ads/AdCard';
import { useCarouselAutoplay } from '@/hooks/useCarouselAutoplay';
import { AD_CAROUSEL_ARROW_NEXT, AD_CAROUSEL_ARROW_PREV } from '@/components/ads/carouselNavStyles';

interface AdCampaignSliderProps {
  ads: AdEntry[];
  onEdit?: () => void;
}

export function AdCampaignSlider({ ads, onEdit }: AdCampaignSliderProps) {
  const n = ads.length;
  const { slide, setSlide, pauseOnHover } = useCarouselAutoplay(n, 3000);

  if (n === 0) return null;

  const showNav = n > 1;

  return (
    <div className="relative w-full max-w-xl mx-auto" {...pauseOnHover}>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/80">
        <div
          className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          {ads.map((ad) => (
            <div key={ad.id} className="w-full min-w-0 flex-shrink-0 px-3 py-3 sm:px-4 sm:py-4">
              <AdCard ad={ad} onEdit={onEdit} onDelete={() => {}} embedded />
            </div>
          ))}
        </div>
      </div>

      {showNav && (
        <>
          <button
            type="button"
            aria-label="Previous campaign"
            onClick={() => setSlide((s) => (s - 1 + n) % n)}
            className={AD_CAROUSEL_ARROW_PREV}
          >
            <svg className="mx-auto h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next campaign"
            onClick={() => setSlide((s) => (s + 1) % n)}
            className={AD_CAROUSEL_ARROW_NEXT}
          >
            <svg className="mx-auto h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5">
              {ads.map((ad, i) => (
                <button
                  key={ad.id}
                  type="button"
                  aria-label={`Campaign ${i + 1} of ${n}`}
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
              {slide + 1}/{n}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
