'use client';

import type { ReactNode } from 'react';

type EmptyVeinSlotFrameProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  /** Outer aspect / sizing, e.g. aspect-square, aspect-[3/2], min-h */
  frameClassName?: string;
};

/**
 * Shared “Diamond Veins” empty-slot chrome: dashed border, emerald hover, plus-area layout.
 * Used by Diamond Veins NFT slots and Kasparex Ads empty cells.
 */
export function EmptyVeinSlotFrame({
  children,
  onClick,
  disabled = false,
  className = '',
  frameClassName = 'aspect-square',
}: EmptyVeinSlotFrameProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`${frameClassName} relative flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900/40 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500/50 transition-all group overflow-hidden text-center w-full ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      {children}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500/50 blur-[2px] translate-y-full group-hover:translate-y-0 transition-transform pointer-events-none" />
    </button>
  );
}

export function EmptyVeinSlotPlusIcon() {
  return (
    <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
      <svg className="w-8 h-8 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </div>
  );
}
