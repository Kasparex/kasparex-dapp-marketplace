'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { AdSlotId } from '@/lib/ads/types';
import { getActiveAdsForSlot, getRandomActiveAdForSlot } from '@/lib/ads/mockAds';

type Variant = 'square' | 'compact' | 'footer';

interface AdSlotProps {
  slotId: AdSlotId;
  variant?: Variant;
}

function AdPlaceholder({ slotId, variant }: { slotId: AdSlotId; variant: Variant }) {
  const isCompact = variant === 'compact';
  const isFooter = variant === 'footer';
  const takeUrl = `/ads?take=${encodeURIComponent(slotId)}`;
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-zinc-100/80 dark:bg-zinc-900/95 overflow-hidden text-center transition-all duration-300 hover:border-[#02abb8]/30 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
      style={
        isFooter
          ? { minHeight: 72, width: '100%' }
          : isCompact
            ? { minHeight: 120 }
            : { minWidth: 200, minHeight: 200 }
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center p-3 w-full">
        <svg className="w-8 h-8 text-zinc-400 dark:text-zinc-600 flex-shrink-0 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium">Available</span>
        <a
          href={takeUrl}
          className="mt-2 text-xs font-semibold text-[#02abb8] hover:text-[#029ca8] hover:underline"
        >
          Take this spot
        </a>
      </div>
    </div>
  );
}

function AdSlotSquare({ ad }: { ad: { imageUrl: string; link: string; title: string } }) {
  return (
    <Link
      href={ad.link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:ring-2 hover:ring-[#02abb8]/50 transition-all"
      title={ad.title}
    >
      <Image
        src={ad.imageUrl}
        alt={ad.title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 120px, 200px"
        unoptimized
      />
    </Link>
  );
}

function AdSlotCompact({ ad }: { ad: { imageUrl: string; link: string; title: string } }) {
  return (
    <Link
      href={ad.link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block relative w-full aspect-[3/2] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:ring-2 hover:ring-[#02abb8]/50 transition-all"
      title={ad.title}
    >
      <Image
        src={ad.imageUrl}
        alt={ad.title}
        fill
        className="object-cover"
        sizes="280px"
        unoptimized
      />
    </Link>
  );
}

function AdSlotFooterSingle({ ad }: { ad: { imageUrl: string; link: string; title: string } }) {
  return (
    <Link
      href={ad.link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="relative block w-full aspect-[32/9] min-h-[72px] max-h-[100px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:ring-2 hover:ring-[#02abb8]/30 transition-all"
      title={ad.title}
    >
      <Image
        src={ad.imageUrl}
        alt={ad.title}
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 1200px"
        unoptimized
      />
    </Link>
  );
}

export function AdSlot({ slotId, variant = 'square' }: AdSlotProps) {
  const isRandomSlot = slotId === 'SIDEBAR_RANDOM';
  const isFooterSlot = slotId === 'FOOTER_BLOCK';

  const allActive = useMemo(() => getActiveAdsForSlot(slotId), [slotId]);
  const [randomAd, setRandomAd] = useState<typeof allActive[0] | null>(null);

  useEffect(() => {
    if (isRandomSlot && allActive.length > 0) {
      setRandomAd(getRandomActiveAdForSlot(slotId));
    }
  }, [slotId, isRandomSlot, allActive.length]);

  const adToShow = useMemo(() => {
    if (isRandomSlot) return randomAd ?? allActive[0] ?? null;
    if (isFooterSlot) return null;
    return allActive[0] ?? null;
  }, [isRandomSlot, isFooterSlot, randomAd, allActive]);

  if (isFooterSlot) {
    if (allActive.length === 0) return <AdPlaceholder slotId={slotId} variant="footer" />;
    return <AdSlotFooterSingle ad={allActive[0]} />;
  }

  const singleAd = adToShow;
  if (!singleAd) return <AdPlaceholder slotId={slotId} variant={variant} />;

  if (variant === 'compact') return <AdSlotCompact ad={singleAd} />;
  return <AdSlotSquare ad={singleAd} />;
}
