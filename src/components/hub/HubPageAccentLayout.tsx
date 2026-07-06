'use client';

import type { ReactNode } from 'react';
import { HubAccentScope } from '@/components/hub/HubAccentScope';

/** Wraps sidebar + main column so accent tokens apply to the full Hub page chrome. */
export function HubPageAccentLayout(props: {
  projectId: string;
  children: ReactNode;
  className?: string;
}) {
  const { projectId, children, className = '' } = props;

  return (
    <HubAccentScope
      projectId={projectId}
      className={`flex min-h-0 w-full flex-1 flex-col lg:flex-row ${className}`.trim()}
    >
      {children}
    </HubAccentScope>
  );
}
