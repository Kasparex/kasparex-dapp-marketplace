'use client';

import type { ReactNode } from 'react';

export const KX_IN_FORM_PREMIUM_UNLOCK_BTN_CLASS =
  'shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white bg-gradient-to-r from-amber-600 to-orange-500 shadow-md shadow-amber-900/20 hover:from-amber-700 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none';

export function KxInFormPremiumRow({
  title,
  description,
  priceLabel,
  checked,
  onToggle,
  disabled,
  trailing,
  className,
}: {
  title: string;
  description: string;
  priceLabel: string;
  checked?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/90 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/50 ${className ?? ''}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-bold text-base text-zinc-900 dark:text-zinc-100">{title}</p>
        <p className="text-sm leading-snug text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
      </div>
      <span className="text-sm font-black tabular-nums text-[#02abb8] shrink-0">{priceLabel}</span>
      {trailing ?? (
        <button
          type="button"
          role="switch"
          aria-checked={checked ?? false}
          disabled={disabled}
          onClick={onToggle}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            checked ? 'bg-[#02abb8]' : 'bg-zinc-300 dark:bg-zinc-600'
          }`}
        >
          <span
            className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      )}
    </div>
  );
}

export function KxInFormPremiumList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`space-y-3 ${className ?? ''}`}>{children}</div>;
}
