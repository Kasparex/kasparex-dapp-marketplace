'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { AdEntry } from '@/lib/ads/types';
import { getSlotConfig } from '@/lib/ads/slots';

interface AdCardProps {
  ad: AdEntry;
}

function formatExpires(endTime: string): string {
  const end = new Date(endTime);
  const now = new Date();
  const days = Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Expired';
  if (days === 1) return 'Expires tomorrow';
  return `Expires in ${days} days`;
}

export function AdCard({ ad }: AdCardProps) {
  const slotConfig = getSlotConfig(ad.slotId);
  const slotLabel = slotConfig?.label ?? ad.slotId;
  const expiresText = formatExpires(ad.endTime);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden hover:border-[#02abb8]/50 transition-colors">
      <Link
        href={ad.link}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800"
      >
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
          unoptimized
        />
      </Link>
      <div className="p-4">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate mb-1">{ad.title}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          {slotLabel}
        </p>
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
          {expiresText}
        </p>
      </div>
    </div>
  );
}
