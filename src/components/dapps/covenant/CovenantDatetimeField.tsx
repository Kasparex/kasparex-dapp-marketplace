/**
 * Shared datetime-local field with LockBox-style quick presets.
 */

'use client';

import { useState } from 'react';
import { CovenantFieldLabel, covenantInputClass } from '@/components/dapps/covenant/CovenantWidgetUi';
import { KX_FORM_ADD_BTN_CLASS } from '@/components/ui/KxLinkRowsEditor';

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
}) {
  const [customAddMinutes, setCustomAddMinutes] = useState('5');

  const bump = (ms: number) => {
    onChange(bumpDatetimeLocalValue(value, ms));
  };

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <CovenantFieldLabel label={label} htmlFor={id} tooltip={tooltip} />
      <input
        id={id}
        type="datetime-local"
        value={value}
        min={minNow ? toDatetimeLocalValue(Date.now()) : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={compact ? `${covenantInputClass} text-sm` : covenantInputClass}
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
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={1}
          step={1}
          value={customAddMinutes}
          onChange={(e) => setCustomAddMinutes(e.target.value)}
          className={`${covenantInputClass} !w-24`}
          aria-label="Minutes to add"
        />
        <button
          type="button"
          onClick={() => {
            const mins = Math.max(1, Math.floor(Number(customAddMinutes) || 0));
            bump(mins * 60_000);
          }}
          className={KX_FORM_ADD_BTN_CLASS}
        >
          Add minutes
        </button>
      </div>
    </div>
  );
}
