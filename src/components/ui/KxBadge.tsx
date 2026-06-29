import type { ReactNode } from 'react';

/** Tag / info badge for listings and metadata (soft fill, no border). */
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
  | 'indigo'
  | 'cyan-solid'
  | 'emerald-solid'
  | 'amber-solid'
  | 'zinc-solid';

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
  'cyan-solid': 'bg-cyan-600 text-white shadow-sm dark:bg-cyan-500',
  'emerald-solid': 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500',
  'amber-solid': 'bg-amber-500 text-white shadow-sm dark:bg-amber-500',
  'zinc-solid': 'bg-zinc-800 text-white shadow-sm dark:bg-zinc-600',
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
