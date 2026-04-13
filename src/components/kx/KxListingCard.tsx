'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { KxListingAccent } from '@/lib/ui/kxListingAccent';
import { kxJoinClasses, kxListingAccentHoverClasses } from '@/lib/ui/kxListingAccent';

const shellBase =
  'kx-listing-card group block overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md shadow-black/[0.06] dark:shadow-black/25 transition-all duration-200';

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
  const cls = kxJoinClasses(shellBase, kxListingAccentHoverClasses(accent), className);
  return (
    <Link href={href} className={cls} data-kx-accent={accent}>
      {children}
    </Link>
  );
}

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
    <div
      className={kxJoinClasses(
        'relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200/60 dark:border-zinc-800/80',
        aspectClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function KxListingCardBody({
  comfortable,
  className,
  children,
}: {
  comfortable?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={kxJoinClasses(comfortable ? 'p-5' : 'p-4', 'min-w-0 flex flex-col', className)}>{children}</div>
  );
}
