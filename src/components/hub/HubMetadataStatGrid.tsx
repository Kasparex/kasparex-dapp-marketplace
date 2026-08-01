'use client';

import type { ReactNode } from 'react';
import { KxCopyIconButton } from '@/components/ui/KxCopyIconButton';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import {
  KX_METADATA_STAT_CARD,
  KX_METADATA_STAT_HINT,
  KX_METADATA_STAT_LABEL,
  KX_METADATA_STAT_VALUE,
  KX_METADATA_STAT_VALUE_ACCENT,
  KX_METADATA_STAT_VALUE_LINK,
  KX_METADATA_STAT_VALUE_MUTED,
  metadataStatGridClassForCount,
} from '@/lib/hub/shellTokens';

export type HubMetadataStat = {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
  copyable?: boolean;
  accent?: boolean;
  muted?: boolean;
  dense?: boolean;
  tooltipTitle?: string;
  tooltipDescription?: string;
  valueNode?: ReactNode;
  className?: string;
};

function shortenDisplay(value: string): string {
  const v = value.trim();
  if (v.length <= 48) return v;
  if (v.startsWith('0x') && v.length >= 42) return `${v.slice(0, 10)}…${v.slice(-8)}`;
  if (v.startsWith('kaspa:') || v.startsWith('kaspatest:')) {
    return `${v.slice(0, 14)}…${v.slice(-10)}`;
  }
  if (/^[a-f0-9]{64}$/i.test(v)) return `${v.slice(0, 12)}…${v.slice(-10)}`;
  if (v.length > 56) return `${v.slice(0, 24)}…${v.slice(-12)}`;
  return v;
}

function looksLikeLongId(value: string): boolean {
  const v = value.trim();
  if (v.length >= 28) return true;
  if (v.startsWith('0x') && v.length >= 20) return true;
  if (v.startsWith('kaspa:') || v.startsWith('kaspatest:')) return true;
  if (/^[a-f0-9]{40,}$/i.test(v)) return true;
  return false;
}

function resolveValueClass(args: {
  dense?: boolean;
  accent?: boolean;
  muted?: boolean;
}): string {
  if (args.dense) {
    return args.accent
      ? KX_METADATA_STAT_VALUE_LINK
      : 'mt-1 text-sm font-semibold leading-snug break-all text-zinc-900 dark:text-zinc-100';
  }
  if (args.muted) return KX_METADATA_STAT_VALUE_MUTED;
  if (args.accent) return KX_METADATA_STAT_VALUE_ACCENT;
  return KX_METADATA_STAT_VALUE;
}

/** Locked Hub metadata box. Tooltip on the whole card (no inline ? icon). */
export function HubMetadataStatCard({
  label,
  value,
  hint,
  mono: _mono = false,
  copyable,
  accent = false,
  muted = false,
  dense = false,
  tooltipTitle,
  tooltipDescription,
  valueNode,
  className = '',
}: HubMetadataStat) {
  if (!value?.trim() && !valueNode) return null;
  const canCopy = copyable ?? Boolean(value?.trim());
  const useDense = dense || looksLikeLongId(value || '');
  const valueClass = resolveValueClass({ dense: useDense, accent, muted });

  const card = (
    <div className={`${KX_METADATA_STAT_CARD} ${className}`.trim()}>
      <div className={KX_METADATA_STAT_LABEL}>
        {label}
        {canCopy && value?.trim() ? (
          <KxCopyIconButton value={value} label={`Copy ${label}`} className="ml-auto shrink-0" />
        ) : null}
      </div>
      <div className={valueClass}>
        {valueNode ? valueNode : <span title={value}>{shortenDisplay(value)}</span>}
      </div>
      {hint?.trim() ? <p className={KX_METADATA_STAT_HINT}>{hint}</p> : null}
    </div>
  );

  if (tooltipTitle && tooltipDescription) {
    return (
      <Tooltip content={gameTooltipRich(tooltipTitle, tooltipDescription)} className="max-w-xs">
        <div className="block h-full min-w-0 text-left">{card}</div>
      </Tooltip>
    );
  }

  return card;
}

export function HubMetadataStatGrid({
  stats,
  className = '',
  gridClassName,
  footer,
}: {
  stats: HubMetadataStat[];
  className?: string;
  /** Override auto count-based grid (e.g. KX_METADATA_STAT_GRID_STACK). */
  gridClassName?: string;
  footer?: ReactNode;
}) {
  const visible = stats.filter((s) => s.value?.trim() || s.valueNode);
  if (visible.length === 0 && !footer) return null;

  const resolvedGrid = gridClassName ?? metadataStatGridClassForCount(visible.length);

  return (
    <div className={className}>
      {visible.length > 0 ? (
        <div className={resolvedGrid}>
          {visible.map((stat, index) => (
            <HubMetadataStatCard
              key={`${stat.label}-${stat.value}-${index}`}
              {...stat}
              className={stat.className}
            />
          ))}
        </div>
      ) : null}
      {footer}
    </div>
  );
}
