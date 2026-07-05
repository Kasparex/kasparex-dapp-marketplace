'use client';

import type { ReactNode } from 'react';

/** Constrains right-panel sidebar content so it never stretches past the viewport. */
export function HubRightPanelAside({ children, panelId }: { children: ReactNode; panelId?: string }) {
  return (
    <div id={panelId} className="w-full min-w-0 max-w-full overflow-x-hidden break-words [overflow-wrap:anywhere]">
      {children}
    </div>
  );
}
