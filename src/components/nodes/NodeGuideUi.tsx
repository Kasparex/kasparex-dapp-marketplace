'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

const TIP_STYLES = {
  tip: 'border-cyan-500/30 bg-cyan-500/8 dark:bg-cyan-950/25 text-cyan-950 dark:text-cyan-100',
  info: 'border-blue-500/25 bg-blue-500/8 dark:bg-blue-950/20 text-blue-950 dark:text-blue-100',
  warn: 'border-amber-500/35 bg-amber-500/10 dark:bg-amber-950/25 text-amber-950 dark:text-amber-100',
  success: 'border-emerald-500/30 bg-emerald-500/8 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100',
} as const;

const TIP_LABELS = {
  tip: 'Tip',
  info: 'Good to know',
  warn: 'Heads up',
  success: 'You get',
} as const;

export function GuideTipBox({
  variant = 'tip',
  title,
  children,
}: {
  variant?: keyof typeof TIP_STYLES;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${TIP_STYLES[variant]}`}>
      <p className="font-bold text-xs uppercase tracking-wide mb-1 opacity-80">
        {title ?? TIP_LABELS[variant]}
      </p>
      <div className="text-[13px] leading-relaxed opacity-95">{children}</div>
    </div>
  );
}

/** Hover the underlined phrase for extra detail (no info icon). */
export function GuideTerm({
  tip,
  children,
  className = '',
}: {
  tip: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tooltip content={tip}>
      <span
        className={`cursor-help border-b border-dotted border-current/50 font-medium text-inherit ${className}`.trim()}
      >
        {children}
      </span>
    </Tooltip>
  );
}

export function GuideStep({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#02abb8]/15 text-[#02abb8] text-xs font-black">
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{title}</p>
        <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{children}</div>
      </div>
    </li>
  );
}
