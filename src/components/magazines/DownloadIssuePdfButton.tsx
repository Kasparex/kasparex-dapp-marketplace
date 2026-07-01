'use client';

import { useState } from 'react';
import { downloadIssuePdf } from '@/lib/pdf/buildIssuePdf';
import type { ComposedSection } from '@/lib/magazines/composeIssue';

interface DownloadIssuePdfButtonProps {
  magazineName: string;
  issueNumber: number;
  issueTitle: string;
  sections: ComposedSection[];
  disabled?: boolean;
  className?: string;
}

export function DownloadIssuePdfButton({
  magazineName,
  issueNumber,
  issueTitle,
  sections,
  disabled,
  className = '',
}: DownloadIssuePdfButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (disabled || sections.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await downloadIssuePdf({ magazineName, issueNumber, issueTitle, sections });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF export failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={disabled || busy || sections.length === 0}
        className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3 border-2 ${
          disabled || sections.length === 0
            ? 'border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-not-allowed'
            : 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900'
        }`}
      >
        {busy ? (
          <span className="w-6 h-6 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </>
        )}
      </button>
      <p className="mt-2 text-[10px] text-zinc-500 text-center">
        Generated on your device. Nothing is stored on Kasparex servers.
      </p>
      {error ? <p className="mt-2 text-xs text-red-500 text-center">{error}</p> : null}
    </div>
  );
}
