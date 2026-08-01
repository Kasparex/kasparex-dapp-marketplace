'use client';

import type { ReactNode } from 'react';
import { KxCopyIconButton } from '@/components/ui/KxCopyIconButton';
import { KX_METADATA_STAT_CARD, KX_METADATA_STAT_GRID } from '@/lib/hub/shellTokens';

export type HubMetadataStat = {
  /** Uppercase-style label shown small above the value. */
  label: string;
  /** Primary value (short). Long IDs are truncated visually; full value stays copyable. */
  value: string;
  /** Optional secondary line under the value. */
  hint?: string;
  /** Use monospace for addresses / hashes. */
  mono?: boolean;
  /** Allow copying the full value. Default true when value is non-empty. */
  copyable?: boolean;
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
}: HubMetadataStat) {
  if (!value?.trim()) return null;
  const canCopy = copyable ?? true;

  return (
    <div className={KX_METADATA_STAT_CARD}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-2 flex items-start gap-1.5">
        <p
          className={`min-w-0 flex-1 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 ${
            mono ? 'font-mono text-base sm:text-lg break-all' : ''
          }`}
          title={value}
        >
          {shortenDisplay(value, mono)}
        </p>
        {canCopy ? (
          <KxCopyIconButton value={value} label={`Copy ${label}`} className="mt-1 shrink-0" />
        ) : null}
      </div>
      {hint?.trim() ? (
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function HubMetadataStatGrid({
  stats,
  className = '',
  footer,
}: {
  stats: HubMetadataStat[];
  className?: string;
  footer?: ReactNode;
}) {
  const visible = stats.filter((s) => s.value?.trim());
  if (visible.length === 0 && !footer) return null;

  return (
    <div className={className}>
      {visible.length > 0 ? (
        <div className={KX_METADATA_STAT_GRID}>
          {visible.map((stat) => (
            <HubMetadataStatCard key={`${stat.label}-${stat.value}`} {...stat} />
          ))}
        </div>
      ) : null}
      {footer}
    </div>
  );
}
