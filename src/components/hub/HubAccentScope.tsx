'use client';

import type { CSSProperties, ReactNode } from 'react';
import { getHubProjectAccent, hubAccentCssVars } from '@/lib/hub/hubProjectAccent';

export function HubAccentScope(props: {
  projectId: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const { projectId, children, className = '', style } = props;
  const accent = getHubProjectAccent(projectId);

  return (
    <div
      data-hub-accent={accent.accentId}
      className={className}
      style={{ ...hubAccentCssVars(accent), ...style }}
    >
      {children}
    </div>
  );
}
