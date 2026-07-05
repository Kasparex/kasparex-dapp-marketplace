'use client';

import type { ReactNode } from 'react';
import { DAppSidePanelToggle } from '@/components/dapps/layout/DAppSidePanelToggle';
import {
  HubMobileRightPanel,
  useHubMobileRightPanel,
} from '@/components/hub/HubMobileRightPanel';

type HubPageRightPanelProps = {
  panelId: string;
  panelTitle?: string;
  rightOpen: boolean;
  onToggle: () => void;
  sidebar: ReactNode;
  children: ReactNode;
  /** Tailwind grid classes when the desktop panel is open */
  mainColClass?: string;
  asideColClass?: string;
  gridClassName?: string;
  hideToggle?: boolean;
};

/** Desktop right column + mobile edge drawer for Hub detail layouts. */
export function HubPageRightPanelGrid({
  panelId,
  panelTitle = 'Side panel',
  rightOpen,
  onToggle,
  sidebar,
  children,
  mainColClass = 'lg:col-span-7',
  asideColClass = 'lg:col-span-5',
  gridClassName = 'grid grid-cols-1 gap-8',
  hideToggle = false,
}: HubPageRightPanelProps) {
  const { isMobile, drawerOpen, closeDrawer } = useHubMobileRightPanel();
  const showDesktopPanel = rightOpen && !isMobile;

  return (
    <>
      <div
        className={`w-full min-w-0 max-w-full ${gridClassName} ${showDesktopPanel ? 'lg:grid-cols-12' : ''}`}
      >
        <div className={`min-w-0 max-w-full ${showDesktopPanel ? mainColClass : 'lg:col-span-12'}`}>
          {children}
        </div>
        {showDesktopPanel ? (
          <aside
            id={panelId}
            className={`hidden lg:flex min-w-0 w-full max-w-full flex-col space-y-6 ${asideColClass}`}
          >
            {sidebar}
          </aside>
        ) : null}
      </div>

      <HubMobileRightPanel
        panelId={`${panelId}-drawer`}
        open={drawerOpen}
        onClose={closeDrawer}
        title={panelTitle}
      >
        {sidebar}
      </HubMobileRightPanel>
    </>
  );
}

export function HubPageRightPanelToggle({
  panelId,
  rightOpen,
  onToggle,
  className = '',
}: {
  panelId: string;
  rightOpen: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <div className={`hidden lg:flex shrink-0 justify-end sm:items-center ${className}`.trim()}>
      <DAppSidePanelToggle open={rightOpen} onToggle={onToggle} panelId={panelId} />
    </div>
  );
}
