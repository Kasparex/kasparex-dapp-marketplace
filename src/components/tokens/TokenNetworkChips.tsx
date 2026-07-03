'use client';

import type { Token } from '@/lib/tokens/types';
import { getTokenNetworkEntries, getNetworkChipLabel } from '@/lib/tokens/networks';
import { Tooltip } from '@/components/ui/Tooltip';

type TokenNetworkChipsProps = {
  token: Token;
  size?: 'sm' | 'md';
  className?: string;
};

export function TokenNetworkChips({ token, size = 'sm', className = '' }: TokenNetworkChipsProps) {
  const entries = getTokenNetworkEntries(token);
  if (entries.length === 0) return null;

  const chipClass =
    size === 'sm'
      ? 'rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide'
      : 'rounded-lg border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      {entries.map((entry) => {
        const label = getNetworkChipLabel(entry.network);
        const status = entry.primary
          ? entry.verified
            ? 'Primary (verified)'
            : 'Primary network'
          : entry.verified
            ? 'Verified'
            : 'Linked (unverified)';
        return (
          <Tooltip key={`${entry.network}-${entry.contractAddress ?? 'none'}`} content={`${label}: ${status}`}>
            <span
              className={`cursor-help border-zinc-200 bg-white/70 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300 ${chipClass} ${
                entry.primary && entry.verified ? 'border-[#02abb8]/40 text-[#02abb8]' : ''
              }`}
            >
              {label}
              {entry.primary && entry.verified ? ' ✓' : null}
              {!entry.primary && !entry.verified ? ' · linked' : null}
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
}
