'use client';

import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import { formatAddress } from '@/lib/vblog/utils';

/**
 * Standard inline author/publisher credit: wallet identicon + shortened address that
 * links to the author's Hub profile. Used across vBlog cards, dApp cards, and lists.
 */
export function AuthorInline({
  address,
  displayName,
  href,
  size = 20,
  className = '',
  prefix = 'by',
}: {
  /** Wallet address (or seed) used for the identicon and the default profile link. */
  address: string;
  /** Optional display text; defaults to the shortened wallet address. */
  displayName?: string;
  /** Profile link. Defaults to the Hub profile for `address`. Pass `null` to render without a link. */
  href?: string | null;
  size?: number;
  className?: string;
  /** Leading label (e.g. "by"). Pass "" to omit. */
  prefix?: string;
}) {
  const label = displayName ?? formatAddress(address);
  const linkHref =
    href === null ? null : href ?? `/u/${encodeURIComponent(address)}?tab=my-articles`;

  return (
    <div className={`flex min-w-0 items-center gap-2 text-xs text-zinc-500 ${className}`.trim()}>
      <Avatar address={address} size={size} className="shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700" />
      <span className="min-w-0 truncate">
        {prefix ? `${prefix} ` : ''}
        {linkHref ? (
          <Link
            href={linkHref}
            className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-[#02abb8] dark:hover:text-[#66dfe8] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {label}
          </Link>
        ) : (
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
        )}
      </span>
    </div>
  );
}
