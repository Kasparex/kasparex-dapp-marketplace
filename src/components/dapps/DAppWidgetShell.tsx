'use client';

import type { ReactNode } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KX_FORM_PANEL } from '@/lib/hub/shellTokens';

export function DAppWidgetShell({
  title,
  hint,
  heading,
  description,
  children,
  footer,
  className = '',
  headerAside,
}: {
  title?: string;
  hint?: string;
  /** Large in-panel title below the section header (Create Article style). */
  heading?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Badge / control aligned to the top-right of the panel header. */
  headerAside?: ReactNode;
}) {
  return (
    <div className={`${KX_FORM_PANEL} relative space-y-6 ${className}`.trim()}>
      {(title || heading || description || headerAside) ? (
        <div>
          {(title || headerAside) ? (
            <div className="mb-3 flex items-start justify-between gap-3">
              {title ? <DAppSectionHeader title={title} hint={hint} className="!mb-0" /> : <div />}
              {headerAside ? <div className="shrink-0 pt-0.5">{headerAside}</div> : null}
            </div>
          ) : null}
          {heading ? (
            <h2 className="mb-3 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{heading}</h2>
          ) : null}
          {description ? <p className="kx-body">{description}</p> : null}
        </div>
      ) : null}
      <div className="space-y-5">{children}</div>
      {footer}
    </div>
  );
}
