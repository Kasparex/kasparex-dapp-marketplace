'use client';

import type { ReactNode } from 'react';
import { GameTabs } from './GameTabs';
import { useGamesRightPanelOpen } from '@/hooks/useGamesRightPanelOpen';
import { HubPageRightPanelGrid, HubPageRightPanelToggle } from '@/components/hub/HubPageRightPanel';
import { GamesLayoutProvider } from './GamesLayoutContext';

type Props = {
  tabs: readonly any[];
  currentTab: string;
  onTabChange: (id: any) => void;
  tabAlerts?: ReactNode;
  main: ReactNode;
  sidebar: ReactNode;
};

/**
 * Profile Hub-style full-width tab strip, then optional alerts, then a collapsible main / right-column grid.
 */
export function GamesWithSidebarLayout({ tabs, currentTab, onTabChange, tabAlerts, main, sidebar }: Props) {
  const [rightOpen, setRightOpen] = useGamesRightPanelOpen(true);

  return (
    <GamesLayoutProvider rightPanelOpen={rightOpen}>
      <div className="flex w-full min-w-0 flex-col gap-6">
        <div className="mb-6 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          <div className="min-w-0 flex-1">
            <GameTabs tabs={tabs as any} value={currentTab} onChange={onTabChange} />
          </div>
          <HubPageRightPanelToggle
            panelId="kasparex-games-side-panel"
            rightOpen={rightOpen}
            onToggle={() => setRightOpen(!rightOpen)}
          />
        </div>
        {tabAlerts ? <div className="w-full min-w-0">{tabAlerts}</div> : null}
        <HubPageRightPanelGrid
          panelId="kasparex-games-side-panel"
          panelTitle="Game panel"
          rightOpen={rightOpen}
          onToggle={() => setRightOpen(!rightOpen)}
          sidebar={sidebar}
          mainColClass="lg:col-span-8"
          asideColClass="lg:col-span-4"
          hideToggle
        >
          {main}
        </HubPageRightPanelGrid>
      </div>
    </GamesLayoutProvider>
  );
}
