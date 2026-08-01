'use client';

import type { ReactNode } from 'react';
import { KxCopyIconButton } from '@/components/ui/KxCopyIconButton';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import {
  KX_METADATA_STAT_CARD,
  KX_METADATA_STAT_GRID,
  KX_METADATA_STAT_VALUE_ACCENT,
} from '@/lib/hub/shellTokens';

export type HubMetadataStat = {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
  copyable?: boolean;
  /** Teal accent value (Tokens Overview style). */
  accent?: boolean;
  tooltipTitle?: string;
  tooltipDescription?: string;
  /** Optional custom value node (links, badges). Overrides string value display. */
  valueNode?: ReactNode;
};

function shortenDisplay(value: string, mono?: boolean): string {
  const v = value.trim();
  if (!mono) return v;
  if (v.length <= 22) return v;
  if (v.startsWith('0x') && v.length >= 42) return `${v.slice(0, 8)}…${v.slice(-6)}`;
  if (v.startsWith('kaspa:') || v.startsWith('kaspatest:')) {
    return `${v.slice(0, 12)}…${v.slice(-8)}`;
  }
  if (/^[a-f0-9]{64}$/i.test(v)) return `${v.slice(0, 10)}…${v.slice(-8)}`;
  if (v.length > 28) return `${v.slice(0, 12)}…${v.slice(-8)}`;
  return v;
}

export function HubMetadataStatCard({
  label,
  value,
  hint,
  mono = false,
  copyable,
  accent = false,
  tooltipTitle,
  tooltipDescription,
  valueNode,
}: HubMetadataStat) {
  if (!value?.trim() && !valueNode) return null;
  const canCopy = copyable ?? Boolean(value?.trim());
  const valueClass = accent
    ? KX_METADATA_STAT_VALUE_ACCENT
    : 'text-zinc-900 dark:text-zinc-100';

  return (
    <div className={KX_METADATA_STAT_CARD}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
        {tooltipTitle && tooltipDescription ? (
          <Tooltip content={gameTooltipRich(tooltipTitle, tooltipDescription)}>
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-xs font-medium text-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
              aria-label={`About ${tooltipTitle}`}
            >
              ?
            </button>
          </Tooltip>
        ) : null}
        {canCopy && value?.trim() ? (
          <KxCopyIconButton value={value} label={`Copy ${label}`} className="ml-auto shrink-0" />
        ) : null}
      </div>
      <div className={`mt-1 text-xl font-semibold tabular-nums tracking-tight ${valueClass}`}>
        {valueNode ? (
          valueNode
        ) : (
          <span className={mono ? 'font-mono text-base sm:text-lg break-all' : undefined} title={value}>
            {shortenDisplay(value, mono)}
          </span>
        )}
      </div>
      {hint?.trim() ? (
        <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function HubMetadataStatGrid({
  stats,
  className = '',
  gridClassName = KX_METADATA_STAT_GRID,
  footer,
}: {
  stats: HubMetadataStat[];
  className?: string;
  gridClassName?: string;
  footer?: ReactNode;
}) {
  const visible = stats.filter((s) => s.value?.trim() || s.valueNode);
  if (visible.length === 0 && !footer) return null;

  return (
    <div className={className}>
      {visible.length > 0 ? (
        <div className={gridClassName}>
          {visible.map((stat) => (
            <HubMetadataStatCard key={`${stat.label}-${stat.value}`} {...stat} />
          ))}
        </div>
      ) : null}
      {footer}
    </div>
  );
}
