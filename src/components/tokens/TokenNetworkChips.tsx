'use client';

import type { Token } from '@/lib/tokens/types';
import {
  getTokenNetworkEntries,
  getNetworkChipShortLabel,
  getNetworkChipStyleClasses,
  getNetworkChipTooltip,
} from '@/lib/tokens/networks';
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
      ? 'rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide'
      : 'rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      {entries.map((entry) => {
        const label = getNetworkChipShortLabel(entry.network);
        const tooltip = getNetworkChipTooltip(entry.network, entry);
        return (
          <Tooltip key={`${entry.network}-${entry.contractAddress ?? 'none'}`} content={tooltip}>
            <span className={`cursor-help ${chipClass} ${getNetworkChipStyleClasses(entry.network)}`}>
              {label}
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
}
