'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { AdSlotId } from '@/lib/ads/types';
import { getActiveAdsForSlot, getRandomActiveAdForSlot } from '@/lib/ads/mockAds';

const PLACEHOLDER_LINK = '/ads';

type Variant = 'square' | 'compact' | 'footer';

interface AdSlotProps {
  slotId: AdSlotId;
  variant?: Variant;
}

function AdPlaceholder({ variant }: { variant: Variant }) {
  const isCompact = variant === 'compact';
  const isFooter = variant === 'footer';
  return (
    <Link
      href={PLACEHOLDER_LINK}
      className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700/80 bg-zinc-100/80 dark:bg-zinc-800/40 text-zinc-400 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/50 transition-colors text-center"
      style={
        isFooter
          ? { minHeight: 72, width: '100%' }
          : isCompact
            ? { minHeight: 120 }
            : { minWidth: 200, minHeight: 200 }
      }
    >
      <span className="text-xs font-medium px-3 py-2">Ad slot</span>
    </Link>
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
