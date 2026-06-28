import type { ReactNode } from 'react';

/** Kasparex standard status badge (matches Kasparex AI listing cards). */
export type KxBadgeVariant =
  | 'cyan'
  | 'emerald'
  | 'violet'
  | 'violet-solid'
  | 'amber'
  | 'zinc'
  | 'rose'
  | 'teal'
  | 'sky'
  | 'orange'
  | 'indigo';

const VARIANT_CLASS: Record<KxBadgeVariant, string> = {
  cyan: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
  emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  violet: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  'violet-solid': 'bg-violet-500/90 text-white',
  amber: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  zinc: 'bg-zinc-200/90 text-zinc-800 dark:bg-zinc-700/90 dark:text-zinc-200',
  rose: 'bg-rose-500/15 text-rose-800 dark:text-rose-300',
  teal: 'bg-teal-500/15 text-teal-800 dark:text-teal-300',
  sky: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  orange: 'bg-orange-500/15 text-orange-800 dark:text-orange-300',
  indigo: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300',
};

export function kxBadgeClassName(variant: KxBadgeVariant = 'cyan', className = ''): string {
  return `shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${VARIANT_CLASS[variant]} ${className}`.trim();
}

export function KxBadge({
  variant = 'cyan',
  className = '',
  children,
}: {
  variant?: KxBadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return <span className={kxBadgeClassName(variant, className)}>{children}</span>;
}
