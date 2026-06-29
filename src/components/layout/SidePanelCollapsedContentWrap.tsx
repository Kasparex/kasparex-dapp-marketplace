'use client';

import type { ReactNode } from 'react';

/** Constrains main tab content width when the right panel is collapsed. */
export function SidePanelCollapsedContentWrap({
  panelOpen,
  children,
}: {
  panelOpen: boolean;
  children: ReactNode;
}) {
  if (panelOpen) return <>{children}</>;
  return <div className="mx-auto w-full max-w-4xl px-2 sm:px-4">{children}</div>;
}
