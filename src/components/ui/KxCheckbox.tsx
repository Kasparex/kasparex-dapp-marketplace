'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';

type KxCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
};

/**
 * Hub-standard checkbox (Games filter / multi-select look).
 * Uses --hub-accent; do not use raw browser checkboxes in Hub UI.
 */
export function KxCheckbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  className = '',
  id,
  ...rest
}: KxCheckboxProps) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`.trim()}
    >
      <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          {...rest}
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          aria-hidden
          className={`inline-flex h-4 w-4 items-center justify-center rounded border transition-colors ${
            checked
              ? 'border-[color:var(--hub-accent)] bg-[color:var(--hub-accent)]'
              : 'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'
          }`}
        >
          {checked ? (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
        </span>
      </span>
      {(label || description) && (
        <span className="min-w-0 flex-1">
          {label ? <span className="font-semibold text-zinc-900 dark:text-zinc-100">{label}</span> : null}
          {description ? (
            <span className="mt-0.5 block text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
              {description}
            </span>
          ) : null}
        </span>
      )}
    </label>
  );
}

type KxRadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  checked: boolean;
  onChange: () => void;
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
  name: string;
};

/** Hub-standard radio control matching filter/selection chrome. */
export function KxRadio({
  checked,
  onChange,
  label,
  description,
  disabled,
  className = '',
  name,
  id,
  value,
  ...rest
}: KxRadioProps) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`.trim()}
    >
      <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          {...rest}
          id={id}
          name={name}
          value={value}
          type="radio"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={() => onChange()}
        />
        <span
          aria-hidden
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
            checked
              ? 'border-[color:var(--hub-accent)]'
              : 'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'
          }`}
        >
          {checked ? (
            <span className="h-2 w-2 rounded-full bg-[color:var(--hub-accent)]" />
          ) : null}
        </span>
      </span>
      {(label || description) && (
        <span className="min-w-0 flex-1">
          {label ? <span className="font-semibold text-zinc-900 dark:text-zinc-100">{label}</span> : null}
          {description ? (
            <span className="mt-0.5 block text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
              {description}
            </span>
          ) : null}
        </span>
      )}
    </label>
  );
}
