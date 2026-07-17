/**
 * Shared datetime-local field with LockBox-style quick presets.
 */

'use client';

import { CovenantFieldLabel, covenantInputClass } from '@/components/dapps/covenant/CovenantWidgetUi';

export const COVENANT_DATETIME_PRESETS = [
  { label: '+1 min', ms: 60_000 },
  { label: '+10 min', ms: 600_000 },
  { label: '+1 h', ms: 3_600_000 },
  { label: '+1 d', ms: 86_400_000 },
  { label: '+1 w', ms: 7 * 86_400_000 },
] as const;

export const covenantDatetimeChipClass =
  'rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-600 hover:border-[#02abb8] hover:text-[#02abb8] dark:border-zinc-700 dark:text-zinc-400';

export function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function bumpDatetimeLocalValue(current: string, ms: number): string {
  const base = current ? new Date(current).getTime() : Date.now();
  const from = Number.isFinite(base) ? Math.max(base, Date.now()) : Date.now();
  return toDatetimeLocalValue(from + ms);
}

export function CovenantDatetimeField({
  id,
  label,
  tooltip,
  value,
  onChange,
  minNow = true,
  compact = false,
  required = false,
}: {
  id: string;
  label: string;
  tooltip?: string;
  value: string;
  onChange: (next: string) => void;
  /** When true, input min is now and bumps never go into the past. */
  minNow?: boolean;
  /** Smaller layout for dense rows (e.g. milestone steps). */
  compact?: boolean;
  required?: boolean;
}) {
  const bump = (ms: number) => {
    onChange(bumpDatetimeLocalValue(value, ms));
  };

  return (
    <div className="space-y-2">
      <CovenantFieldLabel label={label} htmlFor={id} tooltip={tooltip} required={required} />
      <input
        id={id}
        type="datetime-local"
        value={value}
        min={minNow ? toDatetimeLocalValue(Date.now()) : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={compact ? `${covenantInputClass} text-sm` : covenantInputClass}
        required={required}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(toDatetimeLocalValue(Date.now()))}
          className={covenantDatetimeChipClass}
        >
          Now
        </button>
        {COVENANT_DATETIME_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => bump(p.ms)}
            className={covenantDatetimeChipClass}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
