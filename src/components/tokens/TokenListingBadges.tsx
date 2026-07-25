'use client';

import type { ReactNode } from 'react';
import type { Token } from '@/lib/tokens/types';
import type { TokenModuleId } from '@/lib/tokens/modules';
import { Tooltip } from '@/components/ui/Tooltip';
import { HubPointsLightningIcon } from '@/components/hub/HubPointsEarnBadge';

const INACTIVE = 'text-zinc-300 dark:text-zinc-600';

type Slot = {
  id: string;
  label: string;
  activeClass: string;
  Icon: () => ReactNode;
  isActive: (token: Token) => boolean;
};

const UTILITY_SLOTS: Slot[] = [
  {
    id: 'Payments',
    label: 'Payments',
    activeClass: 'text-rose-500 dark:text-rose-400',
    Icon: LayersIcon,
    isActive: (token) => hasUtilityAlias(token, ['Payments', 'dApps', 'Donations', 'Crowdfunding']),
  },
  {
    id: 'Swaps',
    label: 'Swaps',
    activeClass: 'text-amber-500 dark:text-amber-400',
    Icon: StarIcon,
    isActive: (token) => hasUtilityAlias(token, ['Swaps', 'Native L1']),
  },
  {
    id: 'Store',
    label: 'Store',
    activeClass: 'text-cyan-500 dark:text-cyan-400',
    Icon: CartIcon,
    isActive: (token) => hasUtilityAlias(token, ['Store', 'Publishing', 'Games']),
  },
  {
    id: 'Rewards',
    label: 'Rewards',
    activeClass: 'text-violet-500 dark:text-violet-400',
    Icon: GiftIcon,
    isActive: (token) => hasUtilityAlias(token, ['Rewards', 'Redemptions', 'Tier Benefits']),
  },
  {
    id: 'Hub Points',
    label: 'Hub points',
    activeClass: 'text-emerald-500 dark:text-emerald-400',
    Icon: () => <HubPointsLightningIcon className="h-4 w-4" />,
    isActive: (token) => hasUtilityAlias(token, ['Hub Points', 'vBlog Tips', 'Tips']),
  },
];

const MODULE_SLOTS: Array<Slot & { moduleId: TokenModuleId }> = [
  {
    id: 'featured_listing',
    moduleId: 'featured_listing',
    label: 'Featured listing',
    activeClass: 'text-amber-500 dark:text-amber-400',
    Icon: StarIcon,
    isActive: (token) => hasModule(token, 'featured_listing'),
  },
  {
    id: 'roadmap_editor',
    moduleId: 'roadmap_editor',
    label: 'Roadmap',
    activeClass: 'text-sky-500 dark:text-sky-400',
    Icon: MapIcon,
    isActive: (token) => hasModule(token, 'roadmap_editor') || hasModule(token, 'timeline_builder'),
  },
  {
    id: 'premium_analytics',
    moduleId: 'premium_analytics',
    label: 'Analytics',
    activeClass: 'text-indigo-500 dark:text-indigo-400',
    Icon: ChartIcon,
    isActive: (token) => hasModule(token, 'premium_analytics'),
  },
  {
    id: 'highlighted_profile',
    moduleId: 'highlighted_profile',
    label: 'Highlighted',
    activeClass: 'text-fuchsia-500 dark:text-fuchsia-400',
    Icon: SparkIcon,
    isActive: (token) => hasModule(token, 'highlighted_profile'),
  },
  {
    id: 'on_chain_poll',
    moduleId: 'on_chain_poll',
    label: 'Poll',
    activeClass: 'text-orange-500 dark:text-orange-400',
    Icon: PollIcon,
    isActive: (token) => hasModule(token, 'on_chain_poll'),
  },
];

function hasUtilityAlias(token: Token, aliases: string[]): boolean {
  const tips = token.listing?.utilityBadges ?? [];
  return aliases.some((alias) => tips.includes(alias));
}

function hasModule(token: Token, id: TokenModuleId): boolean {
  return Boolean(token.paidModuleIds?.includes(id) || (id === 'featured_listing' && token.listing?.featured));
}

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

/** Instant Hub utility (not Hub Points; lightning is reserved for points). */
function PlugIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100-6h13.5a3 3 0 100 6m-16.5-3a3 3 0 013-3m13.5 0a3 3 0 013 3m-16.5 0V6.75A2.25 2.25 0 018.25 4.5h7.5A2.25 2.25 0 0118 6.75v4.5"
      />
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

function CartIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
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
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
      />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6.75V15m6-6v8.25m.661-12.968a.75.75 0 01.447.723V19.5a.75.75 0 01-1.028.696l-4.147-1.657a.75.75 0 00-.558 0l-4.98 1.992A.75.75 0 013.75 19.5V5.507a.75.75 0 01.447-.723l4.98-1.992a.75.75 0 01.558 0l4.146 1.657a.75.75 0 00.557 0l.001-.001z"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  );
}

function PollIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
    </svg>
  );
}

/** Bare status icons: utilities + premium modules; inactive stay gray. */
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

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`.trim()}>
      <IconGlyph label="Verified" active={verified} activeClass="text-emerald-500 dark:text-emerald-400">
        <ShieldCheckIcon />
      </IconGlyph>
      <IconGlyph
        label="Instant utility"
        active={instantUtility}
        activeClass="text-[color:var(--hub-accent)]"
      >
        <PlugIcon />
      </IconGlyph>
      {UTILITY_SLOTS.map((slot) => {
        const Icon = slot.Icon;
        return (
          <IconGlyph key={slot.id} label={slot.label} active={slot.isActive(token)} activeClass={slot.activeClass}>
            <Icon />
          </IconGlyph>
        );
      })}
      {MODULE_SLOTS.map((slot) => {
        const Icon = slot.Icon;
        return (
          <IconGlyph key={slot.id} label={slot.label} active={slot.isActive(token)} activeClass={slot.activeClass}>
            <Icon />
          </IconGlyph>
        );
      })}
    </div>
  );
}
