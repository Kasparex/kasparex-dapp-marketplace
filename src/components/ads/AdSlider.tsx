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

function SliderPlaceholder() {
  return (
    <Link
      href="/ads"
      className="flex items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:border-[#02abb8] hover:text-[#02abb8] transition-colors min-w-[200px] min-h-[200px]"
    >
      <span className="text-xs font-medium px-3 py-2">Ad slot – book at Kasparex Ads</span>
    </Link>
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

  if (ads.length === 0) return <SliderPlaceholder />;
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
