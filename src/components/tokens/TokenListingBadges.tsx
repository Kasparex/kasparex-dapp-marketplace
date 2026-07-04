'use client';

import type { ReactNode } from 'react';
import type { Token } from '@/lib/tokens/types';
import { Tooltip } from '@/components/ui/Tooltip';

const DEFAULT_MAX_VISIBLE = 4;

type BadgeItem = {
  key: string;
  label: string;
  icon: ReactNode;
};

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip content={label}>
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 cursor-help dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300"
        aria-label={label}
      >
        {children}
      </span>
    </Tooltip>
  );
}

function OverflowButton({ labels }: { labels: string[] }) {
  return (
    <Tooltip content={labels.join(' · ')}>
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-500 cursor-help dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400"
        aria-label={`${labels.length} more badges: ${labels.join(', ')}`}
      >
        …
      </span>
    </Tooltip>
  );
}

function VerifiedIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function UtilityIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function collectBadgeItems(token: Token): BadgeItem[] {
  const listing = token.listing;
  if (!listing) return [];

  const items: BadgeItem[] = [];

  if (listing.verified) {
    items.push({ key: 'verified', label: 'Verified project', icon: <VerifiedIcon /> });
  }
  if (listing.instantUtility) {
    items.push({
      key: 'utility',
      label: 'Instant utility enabled in Kasparex Hub',
      icon: <UtilityIcon />,
    });
  }
  for (const badge of listing.utilityBadges ?? []) {
    items.push({ key: `utility-${badge}`, label: `Utility: ${badge}`, icon: <BadgeIcon /> });
  }

  return items;
}

/** Footer icon badges with optional overflow ellipsis (Featured is shown as a top pill badge). */
export function TokenListingBadges({
  token,
  className = '',
  maxVisible = DEFAULT_MAX_VISIBLE,
}: {
  token: Token;
  className?: string;
  maxVisible?: number;
}) {
  const items = collectBadgeItems(token);
  if (items.length === 0) return null;

  const overflow = items.length > maxVisible;
  const visibleItems = overflow ? items.slice(0, maxVisible - 1) : items;
  const hiddenLabels = overflow ? items.slice(maxVisible - 1).map((item) => item.label) : [];

  return (
    <div className={`flex flex-nowrap items-center gap-1.5 min-w-0 overflow-hidden ${className}`.trim()}>
      {visibleItems.map((item) => (
        <IconButton key={item.key} label={item.label}>
          {item.icon}
        </IconButton>
      ))}
      {overflow ? <OverflowButton labels={hiddenLabels} /> : null}
    </div>
  );
}
