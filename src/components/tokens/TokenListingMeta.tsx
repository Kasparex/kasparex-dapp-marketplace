'use client';

import type { ReactNode } from 'react';
import type { Token } from '@/lib/tokens/types';
import { Tooltip } from '@/components/ui/Tooltip';
import { getTokenListSource } from '@/lib/tokens/source';

const NETWORK_LABELS: Record<Token['network'], string> = {
  L1: 'Kaspa L1 native asset',
  L2: 'EVM Layer-2 token',
};

const TYPE_LABELS: Record<Token['type'], string> = {
  global: 'Global ecosystem token',
  collab: 'Community collaboration token',
};

const SOURCE_LABELS = {
  kasparex: 'Listed by Kasparex',
  community: 'Community listing',
  developer: 'Developer listing',
} as const;

function MetaDot({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip content={label}>
      <span className="inline-flex cursor-help items-center text-zinc-500 dark:text-zinc-400">{children}</span>
    </Tooltip>
  );
}

/** Minimal listing meta with tooltips instead of raw badge labels. */
export function TokenListingMeta({
  token,
  variant = 'inline',
}: {
  token: Token;
  variant?: 'inline' | 'icon';
}) {
  const source = getTokenListSource(token);
  const textClass = variant === 'icon' ? 'text-[10px] font-semibold uppercase tracking-wide' : 'text-[11px] font-medium';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${textClass}`}>
      <MetaDot label={NETWORK_LABELS[token.network]}>
        <span>{token.network}</span>
      </MetaDot>
      <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
        ·
      </span>
      <MetaDot label={TYPE_LABELS[token.type]}>
        <span className="capitalize">{token.type}</span>
      </MetaDot>
      <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
        ·
      </span>
      <MetaDot label={SOURCE_LABELS[source]}>
        <span className="capitalize">{source}</span>
      </MetaDot>
    </div>
  );
}
