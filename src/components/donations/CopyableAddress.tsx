'use client';

import { useState } from 'react';

interface CopyableAddressProps {
  value: string;
  label?: string;
  explorerUrl?: string;
  /** Short label for explorer link, e.g. "Explorer" */
  explorerLabel?: string;
  className?: string;
  /** Display as truncated (e.g. 0x1234...5678) */
  truncate?: boolean;
}

export function CopyableAddress({ value, label, explorerUrl, explorerLabel = 'View in Explorer', className = '', truncate = true }: CopyableAddressProps) {
  const [copied, setCopied] = useState(false);

  const display = truncate && value.length > 14
    ? value.startsWith('0x')
      ? `${value.slice(0, 6)}...${value.slice(-4)}`
      : value.length > 12
        ? `${value.slice(0, 8)}...${value.slice(-4)}`
        : value
    : value;

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className={className}>
      {label && <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">{label}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-sm text-zinc-800 dark:text-zinc-200 break-all" title={value}>
          {display}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Copy address"
          >
            {copied ? (
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            )}
          </button>
          {explorerUrl && explorerUrl !== '#' && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={explorerLabel}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
