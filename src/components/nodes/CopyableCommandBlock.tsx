'use client';

import { useState } from 'react';

interface CopyableCommandBlockProps {
  command: string;
  /** Shown on the copy button after click */
  copiedLabel?: string;
  className?: string;
}

export function CopyableCommandBlock({
  command,
  copiedLabel = 'Copied',
  className = '',
}: CopyableCommandBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`relative mt-2 ${className}`.trim()}>
      <pre className="p-3 pr-24 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs overflow-x-auto font-mono whitespace-pre-wrap break-all text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800">
        {command}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2.5 py-1 rounded-md text-[11px] font-bold border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
        aria-label="Copy command"
      >
        {copied ? copiedLabel : 'Copy'}
      </button>
    </div>
  );
}
