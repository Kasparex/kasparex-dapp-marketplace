'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { AdSlotId } from '@/lib/ads/types';
import { getActiveAdsForSlot } from '@/lib/ads/mockAds';
import { AdSlot } from './AdSlot';

const ROTATE_MS = 5000;

interface AdSliderProps {
  slotId: AdSlotId;
}

function SliderPlaceholder({ slotId }: { slotId: AdSlotId }) {
  const takeUrl = `/ads?take=${encodeURIComponent(slotId)}`;
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-zinc-100/80 dark:bg-zinc-900/95 min-w-[200px] min-h-[200px] transition-all duration-300 hover:border-[#02abb8]/30 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60">
      <svg className="w-8 h-8 text-zinc-400 dark:text-zinc-600 flex-shrink-0 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium">Available</span>
      <a href={takeUrl} className="mt-2 text-xs font-semibold text-[#02abb8] hover:text-[#029ca8] hover:underline">
        Take this spot
      </a>
    </div>
  );
}

export function AdSlider({ slotId }: AdSliderProps) {
  const ads = useMemo(() => getActiveAdsForSlot(slotId), [slotId]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [ads.length]);

  if (ads.length === 0) return <SliderPlaceholder slotId={slotId} />;
  if (ads.length === 1) return <AdSlot slotId={slotId} variant="square" />;

  const ad = ads[index];
  return (
    <Link
      href={ad.link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:ring-2 hover:ring-[#02abb8]/50 transition-all min-w-[180px] min-h-[180px] max-w-[220px] max-h-[220px]"
      title={ad.title}
    >
      <Image
        src={ad.imageUrl}
        alt={ad.title}
        fill
        className="object-cover"
        sizes="220px"
        unoptimized
      />
    </Link>
  );
}
