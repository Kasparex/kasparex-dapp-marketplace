'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

/**
 * Shared surface for Kasparex tooltips (wallet dropdowns, form hints, etc.).
 * Import this when you need the same look outside Radix (rare); prefer `<Tooltip>`.
 */
export const KASPPAREX_TOOLTIP_SURFACE_CLASS =
  'z-50 max-w-xs rounded-lg bg-zinc-100 px-3 py-2.5 text-sm text-zinc-800 shadow-xl border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600';

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={0} skipDelayDuration={0}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', align = 'center', className = '' }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          className={`${KASPPAREX_TOOLTIP_SURFACE_CLASS} ${className}`}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
