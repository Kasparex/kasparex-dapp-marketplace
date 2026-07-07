'use client';

import type { ReactNode } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KX_WIDGET_DETAIL_PANEL } from '@/lib/hub/shellTokens';

export function DAppWidgetShell({
  title,
  hint,
  children,
  footer,
  className = '',
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${KX_WIDGET_DETAIL_PANEL} ${className}`.trim()}>
      {title ? <DAppSectionHeader title={title} hint={hint} className="mb-4" /> : null}
      <div className="space-y-4">{children}</div>
      {footer}
    </div>
  );
}
