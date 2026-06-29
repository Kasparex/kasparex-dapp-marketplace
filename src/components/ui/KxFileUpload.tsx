'use client';

import { useRef } from 'react';

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
}: KxFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      {label ? <label className="k-label">{label}</label> : null}
      <div className="relative flex min-h-[10rem] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-xl border-2 border-dashed border-[#02abb8]/35 bg-gradient-to-br from-[#02abb8]/10 via-transparent to-cyan-500/5 px-4 py-7 transition-all hover:border-[#02abb8]/55 hover:from-[#02abb8]/15 dark:from-[#02abb8]/14 dark:to-cyan-950/25 dark:hover:from-[#02abb8]/20">
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#02abb8]/15 text-[#02abb8] ring-2 ring-[#02abb8]/10 dark:bg-[#02abb8]/25 dark:ring-[#02abb8]/20">
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
        <div className="flex items-center justify-between gap-2 rounded-lg border border-[#02abb8]/25 bg-[#02abb8]/5 px-3 py-2 dark:border-[#02abb8]/30 dark:bg-[#02abb8]/10">
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-[#02abb8]" title={fileName}>
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
