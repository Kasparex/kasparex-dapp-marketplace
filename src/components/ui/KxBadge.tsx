import type { ReactNode } from 'react';

/** Kasparex standard status badge (Hub PTS reward styling). */
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
  | 'reward';

const VARIANT_CLASS: Record<KxBadgeVariant, string> = {
  cyan: 'border-cyan-500/30 bg-cyan-500/15 text-cyan-800 dark:text-cyan-300',
  emerald: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  violet: 'border-violet-500/30 bg-violet-500/15 text-violet-800 dark:text-violet-300',
  'violet-solid': 'border-violet-500/40 bg-violet-500/90 text-white',
  amber: 'border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300',
  zinc: 'border-zinc-500/30 bg-zinc-200/90 text-zinc-800 dark:bg-zinc-700/90 dark:text-zinc-200',
  rose: 'border-rose-500/30 bg-rose-500/15 text-rose-800 dark:text-rose-300',
  teal: 'border-teal-500/30 bg-teal-500/15 text-teal-800 dark:text-teal-300',
  sky: 'border-sky-500/30 bg-sky-500/15 text-sky-800 dark:text-sky-300',
  orange: 'border-orange-500/30 bg-orange-500/15 text-orange-800 dark:text-orange-300',
  indigo: 'border-indigo-500/30 bg-indigo-500/15 text-indigo-800 dark:text-indigo-300',
  reward: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
};

const BADGE_BASE =
  'inline-flex items-center gap-1 shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide';

export function kxBadgeClassName(variant: KxBadgeVariant = 'cyan', className = ''): string {
  return `${BADGE_BASE} ${VARIANT_CLASS[variant]} ${className}`.trim();
}

export function KxBadge({
  variant = 'cyan',
  className = '',
  children,
  icon,
  title,
}: {
  variant?: KxBadgeVariant;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
  title?: string;
}) {
  return (
    <span className={kxBadgeClassName(variant, className)} title={title}>
      {icon}
      {children}
    </span>
  );
}
