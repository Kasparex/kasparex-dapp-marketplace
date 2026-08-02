'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import * as Icons from 'lucide-react';

/** Shared Games “Buy slots” CTA (hub-accent outline). Use across Diamond Veins, Minecore, Precision Click, etc. */
export const GAME_BUY_SLOTS_BTN_CLASS =
  'inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[color:var(--hub-accent)]/45 bg-[color:var(--hub-accent)]/10 px-3 py-2 text-sm font-bold text-[color:var(--hub-accent)] transition-colors hover:border-[color:var(--hub-accent)]/70 hover:bg-[color:var(--hub-accent)]/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[color:var(--hub-accent-light,var(--hub-accent))]';

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
