'use client';

import type { Token } from '@/lib/tokens/types';
import { Tooltip } from '@/components/ui/Tooltip';

const INACTIVE =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-400 opacity-70 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-500';

function IconButton({
  label,
  active,
  activeClass,
  children,
}: {
  label: string;
  active: boolean;
  activeClass: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip content={label}>
      <span
        className={
          active
            ? `inline-flex h-8 w-8 shrink-0 cursor-help items-center justify-center rounded-lg border ${activeClass}`
            : `${INACTIVE} cursor-help`
        }
        aria-label={label}
      >
        {children}
      </span>
    </Tooltip>
  );
}

function ShieldCheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 15l-5.571-3m11.142 0l4.179 2.25L12 21.75 2.25 14.25l4.179-2.25"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h17.25"
      />
    </svg>
  );
}

const UTILITY_ICON_STYLES = [
  {
    activeClass: 'border-rose-500/35 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-300',
    Icon: LayersIcon,
  },
  {
    activeClass: 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300',
    Icon: StarIcon,
  },
  {
    activeClass: 'border-cyan-500/35 bg-cyan-500/10 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/15 dark:text-cyan-300',
    Icon: GiftIcon,
  },
];

/** Status icon row under logo/title: distinct colors and icons per badge type. */
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
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      <IconButton
        label="Verified project"
        active={verified}
        activeClass="border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-300"
      >
        <ShieldCheckIcon />
      </IconButton>
      <IconButton
        label="Instant utility enabled in Kasparex Hub"
        active={instantUtility}
        activeClass="border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:border-indigo-400/35 dark:bg-indigo-500/20 dark:text-indigo-300"
      >
        <ZapIcon />
      </IconButton>
      {utilityTips.map((badge, index) => {
        const style = UTILITY_ICON_STYLES[index % UTILITY_ICON_STYLES.length];
        const Icon = style.Icon;
        return (
          <IconButton key={badge} label={`Utility: ${badge}`} active activeClass={style.activeClass}>
            <Icon />
          </IconButton>
        );
      })}
    </div>
  );
}
