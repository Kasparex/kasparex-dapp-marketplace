'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { KxListingAccent } from '@/lib/ui/kxListingAccent';
import { kxJoinClasses } from '@/lib/ui/kxListingAccent';

/** Matches CrowdKAS `DonationCampaignCard`: rounded-xl, zinc border, emerald hover, no lift/shadow. */
const shellBase =
  'kx-listing-card group block w-full text-left overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:!border-emerald-500 dark:hover:!border-emerald-500 transition-colors';

export function KxListingCard({
  href,
  accent,
  className,
  children,
}: {
  href: string;
  accent: KxListingAccent;
  className?: string;
  children: ReactNode;
}) {
  const cls = kxJoinClasses(shellBase, className);
  return (
    <Link href={href} className={cls} data-kx-accent={accent}>
      {children}
    </Link>
  );
}

/** CrowdKAS listing media: 16/9, zinc plate, no extra divider (campaign cards). */
export function KxListingCardMedia({
  aspectClass = 'aspect-[16/9]',
  className,
  children,
}: {
  aspectClass?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={kxJoinClasses('relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800', aspectClass, className)}>
      {children}
    </div>
  );
}

export function KxListingCardBody({
  comfortable,
  className,
  children,
}: {
  /** CrowdKAS cards use `p-4` (comfortable=false). */
  comfortable?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={kxJoinClasses(comfortable ? 'p-5' : 'p-4', 'min-w-0 flex flex-col', className)}>{children}</div>
  );
}
