import type { ReactNode } from 'react';

export type KxAlertVariant = 'success' | 'error' | 'info' | 'reward';

const VARIANT_CLASS: Record<KxAlertVariant, string> = {
  success:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 dark:bg-emerald-950/40',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200 dark:bg-rose-950/40',
  info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-900 dark:text-cyan-200 dark:bg-cyan-950/40',
  reward:
    'border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100 dark:bg-amber-950/35',
};

const ICON_CLASS: Record<KxAlertVariant, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-rose-600 dark:text-rose-400',
  info: 'text-cyan-600 dark:text-cyan-400',
  reward: 'text-amber-600 dark:text-amber-400',
};

function AlertIcon({ variant }: { variant: KxAlertVariant }) {
  const cls = `h-5 w-5 shrink-0 ${ICON_CLASS[variant]}`;
  if (variant === 'error') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (variant === 'reward') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a4 4 0 00-4-4H8.5M12 8h4.5a2.5 2.5 0 010 5H12m0 0v5m0-5H8.5a2.5 2.5 0 000 5H12" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function KxAlert({
  variant,
  title,
  children,
  className = '',
}: {
  variant: KxAlertVariant;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`flex gap-3 rounded-xl border px-4 py-3.5 ${VARIANT_CLASS[variant]} ${className}`.trim()}
    >
      <AlertIcon variant={variant} />
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-bold leading-snug">{title}</p>
        {children ? <div className="text-sm leading-relaxed opacity-90">{children}</div> : null}
      </div>
    </div>
  );
}
