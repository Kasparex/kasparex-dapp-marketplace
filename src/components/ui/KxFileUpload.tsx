'use client';

import { useRef } from 'react';

type KxFileUploadAccent = 'default' | 'emerald';

const ACCENT_STYLES: Record<
  KxFileUploadAccent,
  { dropzone: string; iconWrap: string; iconText: string; fileChip: string; fileText: string }
> = {
  default: {
    dropzone:
      'border-[color:var(--hub-accent-border)] bg-gradient-to-br from-[color:var(--hub-accent-muted)] via-transparent to-transparent hover:border-[color:var(--hub-accent-border)] hover:from-[color:var(--hub-accent-muted)]',
    iconWrap: 'bg-[color:var(--hub-accent-muted)] text-[color:var(--hub-accent)] ring-[color:var(--hub-accent-border)]',
    iconText: 'text-[color:var(--hub-accent)]',
    fileChip: 'border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)]',
    fileText: 'text-[color:var(--hub-accent)]',
  },
  emerald: {
    dropzone:
      'border-emerald-500/35 bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-400/5 hover:border-emerald-500/55 hover:from-emerald-500/15 dark:from-emerald-500/14 dark:to-emerald-950/25 dark:hover:from-emerald-500/20',
    iconWrap: 'bg-emerald-500/15 text-emerald-600 ring-emerald-500/10 dark:bg-emerald-500/25 dark:ring-emerald-500/20',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    fileChip: 'border-emerald-500/25 bg-emerald-500/5 dark:border-emerald-500/30 dark:bg-emerald-500/10',
    fileText: 'text-emerald-700 dark:text-emerald-300',
  },
};

type KxFileUploadProps = {
  label?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  fileName?: string | null;
  fileCount?: number;
  onClear?: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  accent?: KxFileUploadAccent;
};

export function KxFileUpload({
  label,
  hint,
  accept,
  multiple,
  fileName,
  fileCount,
  onClear,
  onChange,
  disabled,
  accent = 'default',
}: KxFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const styles = ACCENT_STYLES[accent];

  return (
    <div className="space-y-2">
      {label ? <label className="k-label">{label}</label> : null}
      <div
        className={`relative flex min-h-[10rem] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-xl border-2 border-dashed px-4 py-7 transition-all ${styles.dropzone}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          onChange={onChange}
        />
        <div className="pointer-events-none flex flex-col items-center gap-2.5">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ring-2 ${styles.iconWrap}`}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="text-center">
            <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Drop {multiple ? 'files' : 'an image'} or click to browse
            </span>
            {hint ? (
              <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
            ) : null}
          </div>
        </div>
      </div>
      {fileName ? (
        <div className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${styles.fileChip}`}>
          <p className={`min-w-0 flex-1 truncate text-xs font-medium ${styles.fileText}`} title={fileName}>
            {fileName}
          </p>
          {onClear ? (
            <button
              type="button"
              onClick={() => {
                onClear();
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="flex-shrink-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
      {fileCount != null && fileCount > 0 && !fileName ? (
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{fileCount} file(s) uploaded</p>
      ) : null}
    </div>
  );
}
