'use client';

import type { ReactNode } from 'react';
import { DAppTabs, type DAppTab } from './DAppTabs';
import { useDAppRightPanelOpen } from '@/hooks/useDAppRightPanelOpen';
import { DAppSidePanelToggle } from './DAppSidePanelToggle';

type Props<T extends string> = {
  tabs: readonly DAppTab<T>[];
  currentTab: T;
  onTabChange: (id: T) => void;
  main: ReactNode;
  sidebar: ReactNode;
};

/** Full-width tab strip with collapsible right column (Games-style layout, cyan tabs). */
export function DAppsWithSidebarLayout<T extends string>({
  tabs,
  currentTab,
  onTabChange,
  main,
  sidebar,
}: Props<T>) {
  const [rightOpen, setRightOpen] = useDAppRightPanelOpen(true);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="mb-2 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
        <div className="min-w-0 flex-1">
          <DAppTabs tabs={tabs} value={currentTab} onChange={onTabChange} />
        </div>
        <div className="flex shrink-0 justify-end sm:items-center">
          <DAppSidePanelToggle open={rightOpen} onToggle={() => setRightOpen(!rightOpen)} />
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-8 ${rightOpen ? 'lg:grid-cols-12' : ''}`}>
        <div className={`flex min-w-0 flex-col space-y-6 ${rightOpen ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          {main}
        </div>
        {rightOpen ? (
          <aside
            id="kasparex-dapp-side-panel"
            className="flex min-w-0 max-w-full flex-col space-y-6 lg:col-span-5"
          >
            {sidebar}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
