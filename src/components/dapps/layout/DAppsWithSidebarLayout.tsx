'use client';

import type { ReactNode } from 'react';
import { DAppTabs, type DAppTab } from './DAppTabs';
import { useDAppRightPanelOpen } from '@/hooks/useDAppRightPanelOpen';
import { HubPageRightPanelGrid, HubPageRightPanelToggle } from '@/components/hub/HubPageRightPanel';
import { DAppsLayoutProvider, DAppsMainContent } from './DAppsLayoutContext';

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
    <DAppsLayoutProvider rightPanelOpen={rightOpen}>
      <div className="flex w-full min-w-0 flex-col gap-6">
        <div className="mb-2 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          <div className="min-w-0 flex-1">
            <DAppTabs tabs={tabs} value={currentTab} onChange={onTabChange} />
          </div>
          <HubPageRightPanelToggle
            panelId="kasparex-dapp-side-panel"
            rightOpen={rightOpen}
            onToggle={() => setRightOpen(!rightOpen)}
          />
        </div>

        <HubPageRightPanelGrid
          panelId="kasparex-dapp-side-panel"
          panelTitle="Side panel"
          rightOpen={rightOpen}
          onToggle={() => setRightOpen(!rightOpen)}
          sidebar={sidebar}
          mainColClass="lg:col-span-8"
          asideColClass="lg:col-span-4"
          hideToggle
        >
          <DAppsMainContent>{main}</DAppsMainContent>
        </HubPageRightPanelGrid>
      </div>
    </DAppsLayoutProvider>
  );
}
