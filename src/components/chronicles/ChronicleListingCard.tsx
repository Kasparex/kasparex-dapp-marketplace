'use client';

import type { ReactNode } from 'react';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KX_TEXT_BODY_SM } from '@/lib/ui/kxTypography';
import {
  KX_LISTING_PLACEHOLDER_GRADIENT,
  KX_LISTING_PLACEHOLDER_ICON,
} from '@/lib/ui/kxListingPlaceholder';

function ListingPlaceholderIcon({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg
      className={`${KX_LISTING_PLACEHOLDER_ICON} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

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
          <div className={`flex h-full w-full items-center justify-center ${KX_LISTING_PLACEHOLDER_GRADIENT}`}>
            <ListingPlaceholderIcon />
          </div>
        )}
      </KxListingCardMedia>

      <KxListingCardBody className="relative z-10 flex flex-1 min-h-0 flex-col">
        <h3
          className="truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[#02abb8] transition-colors mb-2"
          title={title}
        >
          {title}
        </h3>

        {badges ? <div className="mb-3 flex flex-wrap gap-1.5">{badges}</div> : null}

        <p className={`${KX_TEXT_BODY_SM} line-clamp-3 flex-grow min-h-0 mb-4`}>
          {description}
        </p>

        {footer ? (
          <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">{footer}</div>
        ) : null}
      </KxListingCardBody>
    </KxListingCard>
  );
}
