'use client';

import { KxCopyIconButton } from '@/components/ui/KxCopyIconButton';

/**
 * Platform-standard address row: clickable explorer link + copy/check icon.
 * Typography matches dApps / vBlog metadata (mono xs, hub accent link).
 */
export function TokenCopyableAddress(props: {
  value: string;
  copyLabel?: string;
  explorerUrl?: string | null;
  className?: string;
  truncate?: boolean;
}) {
  const { value, copyLabel = 'Copy address', explorerUrl, className = '', truncate = false } = props;
  if (!value?.trim()) return null;

  const display =
    truncate && value.length > 18
      ? value.startsWith('0x')
        ? `${value.slice(0, 6)}…${value.slice(-4)}`
        : `${value.slice(0, 10)}…${value.slice(-6)}`
      : value;

  const textClass =
    'font-mono text-xs leading-relaxed break-all text-[color:var(--hub-accent,#3b82f6)] hover:underline';

  return (
    <span className={`inline-flex max-w-full items-start gap-1.5 ${className}`.trim()}>
      {explorerUrl ? (
        <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className={textClass} title={value}>
          {display}
        </a>
      ) : (
        <span className="break-all font-mono text-xs leading-relaxed text-zinc-700 dark:text-zinc-300" title={value}>
          {display}
        </span>
      )}
      <KxCopyIconButton value={value} label={copyLabel} className="mt-0.5 shrink-0" />
    </span>
  );
}
