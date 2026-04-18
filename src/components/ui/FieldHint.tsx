'use client';

import { Tooltip } from '@/components/ui/Tooltip';

export function FieldHint({
  text,
  side = 'top',
  align = 'start',
  ariaLabel = 'More info',
}: {
  text: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  ariaLabel?: string;
}) {
  return (
    <Tooltip content={<span className="block text-left leading-snug">{text}</span>} side={side} align={align} className="max-w-sm">
      <button
        type="button"
        className="inline-flex shrink-0 rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-[#02abb8] dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-[#66dfe8]"
        aria-label={ariaLabel}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </Tooltip>
  );
}
