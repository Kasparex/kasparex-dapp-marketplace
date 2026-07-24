'use client';

import type { ReactNode } from 'react';
import { DAppSidePanelToggle } from '@/components/dapps/layout/DAppSidePanelToggle';
import {
  HubMobileRightPanel,
  useHubMobileRightPanel,
} from '@/components/hub/HubMobileRightPanel';
import { HubRightPanelAside } from '@/components/hub/HubRightPanelAside';

type HubPageRightPanelProps = {
  panelId: string;
  panelTitle?: string;
  rightOpen: boolean;
  onToggle: () => void;
  sidebar: ReactNode;
  children: ReactNode;
  /** Legacy col-span tokens; mapped to grid column spans on desktop (e.g. lg:col-span-7). */
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

const COL_SPAN_CLASS: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
};

function colSpanClass(span: number): string {
  const clamped = Math.min(12, Math.max(1, span));
  return COL_SPAN_CLASS[clamped] ?? 'lg:col-span-6';
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
  const mainSpan = colSpanClass(parseLgColSpan(mainColClass, 7));
  const asideSpan = colSpanClass(parseLgColSpan(asideColClass, 5));

  const wrappedSidebar = <HubRightPanelAside panelId={panelId}>{sidebar}</HubRightPanelAside>;

  return (
    <>
      {showDesktopPanel ? (
        <div
          className={`grid w-full min-w-0 max-w-full grid-cols-1 items-stretch lg:grid-cols-12 ${gapClass}`.trim()}
        >
          <div className={`min-w-0 max-w-full overflow-x-clip ${mainSpan}`}>{children}</div>
          <aside className={`hidden h-full min-h-full min-w-0 max-w-full self-stretch overflow-visible lg:block ${asideSpan}`}>
            {wrappedSidebar}
          </aside>
        </div>
      ) : (
        <div className={`w-full min-w-0 max-w-full overflow-hidden ${gapClass}`.trim()}>{children}</div>
      )}

      <HubMobileRightPanel
        panelId={`${panelId}-drawer`}
        open={drawerOpen}
        onClose={closeDrawer}
        title={panelTitle}
      >
        {wrappedSidebar}
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
