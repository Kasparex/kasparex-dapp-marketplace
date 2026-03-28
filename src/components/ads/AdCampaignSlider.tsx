'use client';

import { useEffect, useState } from 'react';
import type { AdEntry } from '@/lib/ads/types';
import { AdCard } from '@/components/ads/AdCard';

interface AdCampaignSliderProps {
  ads: AdEntry[];
  onEdit?: () => void;
}

export function AdCampaignSlider({ ads, onEdit }: AdCampaignSliderProps) {
  const [slide, setSlide] = useState(0);
  const n = ads.length;

  useEffect(() => {
    setSlide((s) => Math.min(s, Math.max(0, n - 1)));
  }, [n]);

  if (n === 0) return null;

  const showNav = n > 1;

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-700">
        <div
          className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          {ads.map((ad) => (
            <div key={ad.id} className="w-full min-w-0 flex-shrink-0 px-2 py-3 sm:px-4 sm:py-4">
              <AdCard ad={ad} onEdit={onEdit} onDelete={() => {}} />
            </div>
          ))}
        </div>
      </div>

      {showNav && (
        <>
          <button
            type="button"
            aria-label="Previous campaign"
            disabled={slide === 0}
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 h-9 w-9 ml-1 rounded-full border border-zinc-200/90 bg-white/95 text-zinc-700 shadow-sm backdrop-blur-sm hover:border-[#02abb8]/40 hover:text-[#02abb8] disabled:pointer-events-none disabled:opacity-25 dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-200"
          >
            <svg className="mx-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next campaign"
            disabled={slide >= n - 1}
            onClick={() => setSlide((s) => Math.min(n - 1, s + 1))}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 h-9 w-9 mr-1 rounded-full border border-zinc-200/90 bg-white/95 text-zinc-700 shadow-sm backdrop-blur-sm hover:border-[#02abb8]/40 hover:text-[#02abb8] disabled:pointer-events-none disabled:opacity-25 dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-200"
          >
            <svg className="mx-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
