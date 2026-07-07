import type { ReactNode } from 'react';
import { KxAlert, type KxAlertVariant } from '@/components/ui/KxAlert';

export type KxCalloutVariant = KxAlertVariant | 'warning';

const WARNING_CLASS =
  'border-violet-500/30 bg-violet-500/10 text-violet-900 dark:text-violet-200 dark:bg-violet-950/40';

export function KxCallout({
  variant,
  title,
  children,
  className = '',
}: {
  variant: KxCalloutVariant;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  if (variant === 'warning') {
    return (
      <div
        role="status"
        className={`flex gap-3 rounded-xl border px-4 py-3.5 ${WARNING_CLASS} ${className}`.trim()}
      >
        <svg className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-bold leading-snug">{title}</p>
          {children ? <div className="text-sm leading-relaxed opacity-90">{children}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <KxAlert variant={variant} title={title} className={className}>
      {children}
    </KxAlert>
  );
}
