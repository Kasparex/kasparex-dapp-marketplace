'use client';

import type { Token } from '@/lib/tokens/types';

/** Ticker as primary title, full name as secondary text. */
export function TokenTitle({
  token,
  size = 'md',
  className = '',
}: {
  token: Token;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const titleClass =
    size === 'lg'
      ? 'text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white'
      : size === 'sm'
        ? 'text-sm font-semibold text-zinc-900 dark:text-zinc-100'
        : 'text-base font-bold text-zinc-900 dark:text-zinc-100';

  const subtitleClass =
    size === 'lg'
      ? 'mt-2 kx-body max-w-2xl'
      : size === 'sm'
        ? 'text-[11px] text-zinc-500 dark:text-zinc-400 truncate'
        : 'text-sm text-zinc-500 dark:text-zinc-400 truncate';

  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <p className={`${titleClass} truncate`}>{token.symbol}</p>
      <p className={subtitleClass}>{token.name}</p>
    </div>
  );
}
