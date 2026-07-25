'use client';

import type { ReactNode } from 'react';
import type { Token } from '@/lib/tokens/types';
import { Tooltip } from '@/components/ui/Tooltip';

const INACTIVE = 'text-zinc-300 dark:text-zinc-600';

/** Fixed catalog so every card shows the full icon set (active vs gray). */
const UTILITY_SLOTS = [
  {
    id: 'Payments',
    label: 'Payments',
    activeClass: 'text-rose-500 dark:text-rose-400',
    Icon: LayersIcon,
    aliases: ['Payments', 'dApps', 'Donations', 'Crowdfunding'],
  },
  {
    id: 'Swaps',
    label: 'Swaps',
    activeClass: 'text-amber-500 dark:text-amber-400',
    Icon: StarIcon,
    aliases: ['Swaps', 'Native L1'],
  },
  {
    id: 'Store',
    label: 'Store',
    activeClass: 'text-cyan-500 dark:text-cyan-400',
    Icon: GiftIcon,
    aliases: ['Store', 'Publishing', 'Games'],
  },
  {
    id: 'Rewards',
    label: 'Rewards',
    activeClass: 'text-violet-500 dark:text-violet-400',
    Icon: TrophyIcon,
    aliases: ['Rewards', 'Redemptions', 'Tier Benefits'],
  },
  {
    id: 'Hub Points',
    label: 'Hub Points',
    activeClass: 'text-lime-600 dark:text-lime-400',
    Icon: SparkIcon,
    aliases: ['Hub Points', 'vBlog Tips', 'Tips'],
  },
] as const;

function IconGlyph({
  label,
  active,
  activeClass,
  children,
}: {
  label: string;
  active: boolean;
  activeClass: string;
  children: ReactNode;
}) {
  return (
    <Tooltip content={label}>
      <span
        className={`inline-flex h-4 w-4 shrink-0 cursor-help items-center justify-center ${
          active ? activeClass : INACTIVE
        }`}
        aria-label={label}
      >
        {children}
      </span>
    </Tooltip>
  );
}

function ShieldCheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25} aria-hidden>
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
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
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
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
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
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h17.25"
      />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 10.5h-1.5A3.375 3.375 0 007.5 14.25v4.5m9-12.75h.008v.008H16.5V6zm-9 0h.008v.008H7.5V6z"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
      />
    </svg>
  );
}

/** Bare status icons (DApps-style): no wrappers; inactive icons stay gray. */
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
  const utilityTips = new Set(listing?.utilityBadges ?? []);

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`.trim()}>
      <IconGlyph
        label="Verified project"
        active={verified}
        activeClass="text-emerald-500 dark:text-emerald-400"
      >
        <ShieldCheckIcon />
      </IconGlyph>
      <IconGlyph
        label="Instant utility enabled in Kasparex Hub"
        active={instantUtility}
        activeClass="text-[color:var(--hub-accent)]"
      >
        <ZapIcon />
      </IconGlyph>
      {UTILITY_SLOTS.map((slot) => {
        const Icon = slot.Icon;
        const active = slot.aliases.some((alias) => utilityTips.has(alias));
        return (
          <IconGlyph
            key={slot.id}
            label={slot.label}
            active={active}
            activeClass={slot.activeClass}
          >
            <Icon />
          </IconGlyph>
        );
      })}
    </div>
  );
}
