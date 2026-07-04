'use client';

import type { ReactNode } from 'react';
import type { Token } from '@/lib/tokens/types';
import { Tooltip } from '@/components/ui/Tooltip';

const ACTIVE_ICON =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#02abb8]/35 bg-[#02abb8]/10 text-[#02abb8] cursor-help dark:border-[#02abb8]/40 dark:bg-[#02abb8]/15 dark:text-[#66dfe8]';

const INACTIVE_ICON =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-400 cursor-help opacity-70 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-500';

function IconButton({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip content={label}>
      <span className={active ? ACTIVE_ICON : INACTIVE_ICON} aria-label={label}>
        {children}
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

/** Always-visible footer icon badges: active when assigned, muted when not. */
export function TokenListingBadges({
  token,
  className = '',
}: {
  token: Token;
  className?: string;
}) {
  const listing = token.listing;
  const verified = Boolean(listing?.verified);
  const instantUtility = Boolean(listing?.instantUtility);
  const utilityTips = listing?.utilityBadges ?? [];

  return (
    <div className={`flex flex-nowrap items-center justify-center gap-1.5 ${className}`.trim()}>
      <IconButton label="Verified project" active={verified}>
        <VerifiedIcon />
      </IconButton>
      <IconButton label="Instant utility enabled in Kasparex Hub" active={instantUtility}>
        <UtilityIcon />
      </IconButton>
      {utilityTips.map((badge) => (
        <IconButton key={badge} label={`Utility: ${badge}`} active>
          <BadgeIcon />
        </IconButton>
      ))}
    </div>
  );
}
