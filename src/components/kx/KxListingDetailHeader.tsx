'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { KX_DETAIL_HEADER } from '@/lib/hub/shellTokens';
import { KxListingFeaturedPlaceholder } from '@/components/kx/KxListingFeaturedPlaceholder';

export function KxListingDetailHeader({
  id = 'listing-header',
  highlighted = false,
  compact = false,
  logo,
  titleBlock,
  topRight,
  excerpt,
  linksRow,
  chipsRow,
  footerRow,
  featuredImageUrl,
  featuredAlt,
  overlayActions,
  className = '',
}: {
  id?: string;
  highlighted?: boolean;
  compact?: boolean;
  logo: ReactNode;
  titleBlock: ReactNode;
  topRight?: ReactNode;
  excerpt?: ReactNode;
  linksRow?: ReactNode;
  chipsRow?: ReactNode;
  footerRow?: ReactNode;
  featuredImageUrl?: string | null;
  featuredAlt?: string;
  overlayActions?: ReactNode;
  className?: string;
}) {
  if (compact) {
    return (
      <div
        id={id}
        className={`${KX_DETAIL_HEADER} select-text ${
          highlighted
            ? 'border-amber-400/60 shadow-[0_0_40px_-12px_rgba(251,191,36,0.45)]'
            : ''
        } ${className}`.trim()}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br via-transparent to-transparent ${
            highlighted ? 'from-amber-500/10' : 'from-cyan-500/5'
          }`}
        />

        <div className="relative flex flex-col lg:flex-row">
          <div className="relative flex w-full flex-col p-4 sm:p-5 lg:w-[58%] lg:min-h-[168px]">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">{logo}</div>
              <div className="min-w-0 flex-1">{titleBlock}</div>
              {topRight ? <div className="flex-shrink-0">{topRight}</div> : null}
            </div>
            {footerRow ? <div className="mt-4">{footerRow}</div> : null}
          </div>

          <div className="relative flex min-h-[140px] w-full items-center justify-center border-t border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-700 dark:bg-zinc-950 lg:min-h-[168px] lg:w-[42%] lg:border-l lg:border-t-0">
            {featuredImageUrl ? (
              <div className="relative h-[120px] w-full max-w-[280px] sm:h-[132px]">
                <Image
                  src={featuredImageUrl}
                  alt={featuredAlt || 'Featured image'}
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            ) : (
              <KxListingFeaturedPlaceholder className="h-[120px] w-full sm:h-[132px]" iconClassName="h-12 w-12" />
            )}
          </div>
        </div>

        {(excerpt || linksRow || chipsRow) ? (
          <div className="relative border-t border-zinc-200 px-4 py-3 dark:border-zinc-700 sm:px-5">
            {excerpt ? <div className="mb-3 text-sm text-zinc-600 dark:text-zinc-400 select-text">{excerpt}</div> : null}
            {linksRow ? <div className="mb-3">{linksRow}</div> : null}
            {chipsRow ? <div className="flex flex-wrap items-center gap-2">{chipsRow}</div> : null}
          </div>
        ) : null}

        {overlayActions}
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`${KX_DETAIL_HEADER} select-text ${
        highlighted
          ? 'border-amber-400/60 shadow-[0_0_40px_-12px_rgba(251,191,36,0.45)]'
          : ''
      } ${className}`.trim()}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br via-transparent to-transparent ${
          highlighted ? 'from-amber-500/10' : 'from-cyan-500/5'
        }`}
      />

      <div className="relative flex min-h-[320px] flex-col lg:min-h-[360px] lg:flex-row">
        <div className="relative flex w-full flex-1 flex-col p-6 sm:p-8 lg:w-1/2 lg:p-10">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex-shrink-0">{logo}</div>
            <div className="min-w-0 flex-1">{titleBlock}</div>
            {topRight ? <div className="flex-shrink-0">{topRight}</div> : null}
          </div>

          {excerpt ? <div className="kx-body mb-5 max-w-2xl select-text">{excerpt}</div> : null}
          {linksRow ? <div className="mb-5">{linksRow}</div> : null}
          {chipsRow ? <div className="mb-4 flex flex-wrap items-center gap-2">{chipsRow}</div> : null}
          {footerRow ? <div className="mt-auto pt-3">{footerRow}</div> : null}
        </div>

        <div className="relative min-h-[220px] w-full border-t border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 lg:min-h-full lg:w-1/2 lg:border-l lg:border-t-0">
          {featuredImageUrl ? (
            <Image
              src={featuredImageUrl}
              alt={featuredAlt || 'Featured image'}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <KxListingFeaturedPlaceholder className="min-h-[220px] lg:min-h-full" iconClassName="h-16 w-16" />
          )}
        </div>
      </div>

      {overlayActions}
    </div>
  );
}
