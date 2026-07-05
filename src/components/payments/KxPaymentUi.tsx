'use client';

import type { ReactNode } from 'react';

export function KxModalSectionTitle({
  children,
  className,
  required,
}: {
  children: ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 mb-2 ${className ?? ''}`}>
      <span
        className="h-5 w-1 shrink-0 rounded-full bg-[#02abb8] shadow-[0_0_10px_rgba(2,171,184,0.35)] -skew-y-12"
        aria-hidden
      />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300 inline-flex items-baseline gap-1 flex-wrap">
        <span>{children}</span>
        {required ? (
          <span className="text-red-500 dark:text-red-400 font-bold normal-case" aria-hidden title="Required">
            *
          </span>
        ) : null}
      </p>
    </div>
  );
}

export function KxModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="h-6 w-1 shrink-0 rounded-full bg-[#02abb8] shadow-[0_0_12px_rgba(2,171,184,0.35)] -skew-y-12"
          aria-hidden
        />
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">{title}</h2>
          {subtitle ? (
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function KxPaymentSummary({
  children,
  totalLabel,
  totalValue,
}: {
  children: ReactNode;
  totalLabel?: string;
  totalValue: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/40 p-4 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
      <KxModalSectionTitle className="mb-1">Summary</KxModalSectionTitle>
      {children}
      <p className="text-base font-bold text-[#02abb8] dark:text-[#02abb8] pt-1 border-t border-zinc-200 dark:border-zinc-600 mt-2 tabular-nums">
        {totalLabel ?? 'Total'}: {totalValue}
      </p>
    </div>
  );
}
