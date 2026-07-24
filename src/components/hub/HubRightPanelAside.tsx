'use client';

import type { ReactNode } from 'react';

/**
 * Right-panel sidebar shell. Keep overflow visible so position:sticky Ad Slots work.
 */
export function HubRightPanelAside({ children, panelId }: { children: ReactNode; panelId?: string }) {
  return (
    <div
      id={panelId}
      className="h-full min-h-full w-full min-w-0 max-w-full break-words [overflow-wrap:anywhere]"
    >
      {children}
    </div>
  );
}
