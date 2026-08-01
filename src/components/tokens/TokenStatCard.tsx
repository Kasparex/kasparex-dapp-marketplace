'use client';

import type { ReactNode } from 'react';
import { HubMetadataStatCard } from '@/components/hub/HubMetadataStatGrid';
import {
  KX_METADATA_STAT_VALUE,
  KX_METADATA_STAT_VALUE_ACCENT,
  KX_METADATA_STAT_VALUE_MUTED,
} from '@/lib/hub/shellTokens';

/**
 * Tokens alias for the locked Hub metadata box.
 * Always renders HubMetadataStatCard. Do not invent local box styles here.
 */
export function TokenStatCard(props: {
  label: string;
  value: ReactNode;
  hint?: string;
  tooltipTitle?: string;
  tooltipDescription?: string;
  /** Prefer accent / muted; custom classes only for rare cases. */
  valueClassName?: string;
  className?: string;
  copyable?: boolean;
  accent?: boolean;
  muted?: boolean;
}) {
  const {
    label,
    value,
    hint,
    tooltipTitle,
    tooltipDescription,
    valueClassName,
    className = '',
    copyable,
    accent: accentProp,
    muted: mutedProp,
  } = props;

  const accent =
    accentProp ??
    Boolean(valueClassName?.includes('hub-accent') || valueClassName === KX_METADATA_STAT_VALUE_ACCENT);
  const muted =
    mutedProp ??
    Boolean(
      valueClassName?.includes('text-zinc-400') ||
        valueClassName?.includes('text-zinc-500') ||
        valueClassName === KX_METADATA_STAT_VALUE_MUTED,
    );

  const stringValue = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  const valueNode =
    typeof value === 'string' || typeof value === 'number' ? undefined : (
      <span
        className={
          accent
            ? KX_METADATA_STAT_VALUE_ACCENT.replace(/^mt-1\s+/, '')
            : muted
              ? KX_METADATA_STAT_VALUE_MUTED.replace(/^mt-1\s+/, '')
              : KX_METADATA_STAT_VALUE.replace(/^mt-1\s+/, '')
        }
      >
        {value}
      </span>
    );

  return (
    <HubMetadataStatCard
      label={label}
      value={stringValue || ' '}
      valueNode={valueNode}
      hint={hint}
      tooltipTitle={tooltipTitle}
      tooltipDescription={tooltipDescription}
      copyable={copyable ?? false}
      accent={accent && !muted}
      muted={muted}
      className={className}
    />
  );
}
