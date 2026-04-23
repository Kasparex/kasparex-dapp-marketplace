'use client';

import { Tooltip } from '@/components/ui/Tooltip';

export type StatusDotTone = 'ok' | 'warn' | 'bad' | 'info';

export function StatusDot({
  tone,
  tooltip,
  className = '',
}: {
  tone: StatusDotTone;
  tooltip: string;
  className?: string;
}) {
  const cls =
    tone === 'ok'
      ? 'bg-emerald-500'
      : tone === 'warn'
        ? 'bg-amber-500'
        : tone === 'bad'
          ? 'bg-rose-500'
          : 'bg-zinc-400 dark:bg-zinc-500';

  return (
    <Tooltip content={tooltip}>
      <span className={['inline-flex h-2.5 w-2.5 rounded-full', cls, className].join(' ')} aria-hidden />
    </Tooltip>
  );
}

