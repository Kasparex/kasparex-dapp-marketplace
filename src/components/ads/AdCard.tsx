'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { AdEntry, AdFormat } from '@/lib/ads/types';
import { getSlotConfig } from '@/lib/ads/slots';
import { Tooltip } from '@/components/ui/Tooltip';
import { featuredAccentForAd } from '@/lib/ads/featuredAccent';

interface AdCardProps {
  ad: AdEntry;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Inside a carousel shell: omit outer card border/shadow */
  embedded?: boolean;
}

function formatExpires(endTime: string): string {
  const endMs = new Date(endTime).getTime();
  const ms = endMs - Date.now();
  if (ms <= 0) return 'Expired';

  const minutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));

  if (minutes < 1) return 'Under 1 min left';
  if (minutes < 90) return minutes === 1 ? '1 min left' : `${minutes} min left`;
  if (hours < 48) return hours === 1 ? '1 hour left' : `${hours} hours left`;
  if (days === 1) return 'Expires tomorrow';
  return `${days} days left`;
}

function getProgressPercent(startTime: string, endTime: string): number {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const now = Date.now();
  if (now >= end) return 0;
  if (now <= start) return 100;
  const elapsed = now - start;
  const total = end - start;
  const remaining = Math.max(0, 100 - (elapsed / total) * 100);
  return Math.round(remaining);
}

function getAspectClass(format: AdFormat): string {
  switch (format) {
    case 'square':
      return 'aspect-square';
    case 'tall':
      return 'aspect-[3/4]';
    case 'rectangle':
    default:
      return 'aspect-[3/2]';
  }
}

export function AdCard({ ad, onEdit, onDelete, embedded = false }: AdCardProps) {
  const slotConfig = getSlotConfig(
    ad.slotId === 'GAMES_PLAY_RAIL_RIGHT' ? 'HALO_GAMES_RIGHT' : ad.slotId,
  );
  const slotLabel = slotConfig?.label ?? ad.slotId;
  const expiresText = formatExpires(ad.endTime);
  const format = ad.format ?? 'rectangle';
  const aspectClass = getAspectClass(format);
  const progressPercent = getProgressPercent(ad.startTime, ad.endTime);
  const featured = ad.featuredHighlight === true;
  const promoTip = ad.promoTooltip?.trim();

  const featuredShell = featured ? featuredAccentForAd(ad.id).frameClass : '';
  const shellClass = embedded
    ? featured
      ? `rounded-xl bg-transparent ${featuredShell}`
      : 'rounded-xl bg-transparent'
    : featured
      ? `rounded-xl bg-white dark:bg-zinc-900/50 ${featuredShell} hover:brightness-[1.02] dark:hover:brightness-110`
      : 'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-pink-500 hover:shadow-xl hover:shadow-pink-500/10';

  return (
    <div className={`group overflow-hidden transition-all duration-300 ${shellClass}`}>
      {promoTip ? (
        <Tooltip content={promoTip}>
          <Link
            href={ad.link}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={`${ad.title}. ${promoTip}`}
            className={`block relative w-full ${aspectClass} bg-zinc-100/80 dark:bg-zinc-900/95 overflow-hidden`}
          >
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </Link>
        </Tooltip>
      ) : (
        <Link
          href={ad.link}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`block relative w-full ${aspectClass} bg-zinc-100/80 dark:bg-zinc-900/95 overflow-hidden`}
        >
          <Image
            src={ad.imageUrl}
            alt={ad.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </Link>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate flex-1 min-w-0">{ad.title}</h3>
          {(onEdit != null || onDelete != null) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {onEdit != null && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onEdit(); }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-[#02abb8] hover:bg-[#02abb8]/10 transition-colors"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDelete != null && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onDelete(); }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          {slotLabel}
        </p>
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            {expiresText}
          </p>
        </div>
      </div>
    </div>
  );
}
