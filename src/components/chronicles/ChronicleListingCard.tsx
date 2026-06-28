'use client';

import type { ReactNode } from 'react';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';

/** Listing card layout aligned with Kasparex dApps `DAppCard`. */
export function ChronicleListingCard({
  href,
  onClick,
  imageUrl,
  alt,
  title,
  description,
  badges,
  footer,
}: {
  href?: string;
  onClick?: () => void;
  imageUrl?: string | null;
  alt: string;
  title: string;
  description: string;
  badges?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <KxListingCard
      href={href}
      onClick={onClick}
      accent="chronicles"
      className="relative flex flex-col min-h-0"
    >
      <KxListingCardMedia>
        {imageUrl ? (
          <img src={imageUrl} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-12 w-12 text-zinc-400 dark:text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </KxListingCardMedia>

      <KxListingCardBody className="relative z-10 flex flex-1 min-h-0 flex-col">
        <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
          <h3
            className="flex-1 truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[#02abb8] transition-colors"
            title={title}
          >
            {title}
          </h3>
          {badges ? <div className="flex flex-wrap gap-1.5 justify-end shrink-0">{badges}</div> : null}
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed flex-grow min-h-0 mb-4">
          {description}
        </p>

        {footer ? (
          <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">{footer}</div>
        ) : null}
      </KxListingCardBody>
    </KxListingCard>
  );
}
