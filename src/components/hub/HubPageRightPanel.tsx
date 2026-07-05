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
  /** Legacy col-span tokens; mapped to flex grow ratios on desktop (e.g. lg:col-span-7). */
  mainColClass?: string;
  asideColClass?: string;
  gridClassName?: string;
  hideToggle?: boolean;
};

function parseLgColSpan(className: string, fallback: number): number {
  const match = className.match(/lg:col-span-(\d+)/);
  return match ? Number(match[1]) : fallback;
}

function layoutGapClass(gridClassName: string): string {
  return gridClassName.replace(/\bgrid\b/g, '').replace(/\bgrid-cols-\d+\b/g, '').trim();
}

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
  const gapClass = layoutGapClass(gridClassName);
  const mainFr = parseLgColSpan(mainColClass, 7);
  const asideFr = parseLgColSpan(asideColClass, 5);

  return (
    <>
      {showDesktopPanel ? (
        <div
          className={`flex w-full min-w-0 max-w-full flex-col lg:flex-row lg:items-start ${gapClass}`.trim()}
        >
          <div className="min-w-0 max-w-full overflow-hidden" style={{ flex: `${mainFr} 1 0%` }}>
            {children}
          </div>
          <aside
            id={panelId}
            className="hidden min-w-0 max-w-full shrink-0 flex-col space-y-6 overflow-hidden lg:flex"
            style={{ flex: `${asideFr} 1 0%` }}
          >
            {sidebar}
          </aside>
        </div>
      ) : (
        <div className={`w-full min-w-0 max-w-full ${gapClass}`.trim()}>{children}</div>
      )}

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
