'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import * as Icons from 'lucide-react';

/**
 * Shared Games “Buy slots” CTA. Matches Diamond Veins / Minecore chrome
 * (emerald outline + soft fill). Use this everywhere instead of one-off buttons.
 */
export const GAME_BUY_SLOTS_BTN_CLASS =
  'inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-800 transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-200';

export function GameBuySlotsButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    /** Hide the leading + icon. */
    hideIcon?: boolean;
  },
) {
  const { children, className, hideIcon, type, ...rest } = props;
  return (
    <button type={type ?? 'button'} className={`${GAME_BUY_SLOTS_BTN_CLASS} ${className ?? ''}`.trim()} {...rest}>
      {hideIcon ? null : <Icons.Plus className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
}
