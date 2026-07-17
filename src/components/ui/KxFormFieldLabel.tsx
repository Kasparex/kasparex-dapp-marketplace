'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

/** Form field label with platform tilt accent, optional tooltip and layout hint. */
export function KxFormFieldLabel({
  children,
  className = '',
  htmlFor,
  tooltip,
  layoutHint,
  required,
}: {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
  tooltip?: string;
  layoutHint?: string;
  required?: boolean;
}) {
  const label = (
    <span className={`inline-flex items-center gap-2 min-w-0 flex-wrap ${className}`.trim()}>
      <span
        className="h-3.5 w-0.5 shrink-0 rounded-full bg-[color:var(--hub-accent)] shadow-[0_0_10px_var(--hub-accent-shadow)] -skew-y-12"
        aria-hidden="true"
      />
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1.5">
        {children}
        {required ? <span className="text-rose-500" aria-hidden="true">*</span> : null}
      </span>
      {layoutHint ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          {layoutHint}
        </span>
      ) : null}
      {tooltip ? (
        <Tooltip content={tooltip}>
          <button
            type="button"
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-500 hover:border-[color:var(--hub-accent-border)] hover:text-[color:var(--hub-accent)] dark:border-zinc-600 dark:text-zinc-400"
            aria-label="Field help"
          >
            ?
          </button>
        </Tooltip>
      ) : null}
    </span>
  );

  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} className="block mb-2 cursor-pointer">
        {label}
      </label>
    );
  }

  return label;
}
