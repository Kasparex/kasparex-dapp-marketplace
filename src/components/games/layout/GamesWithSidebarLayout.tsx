'use client';

import type { ReactNode } from 'react';
import { GameTabs } from './GameTabs';
import { useGamesRightPanelOpen } from '@/hooks/useGamesRightPanelOpen';
import { GamesSidePanelToggle } from './GamesSidePanelToggle';

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
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="w-full min-w-0">
        <GameTabs tabs={tabs as any} value={currentTab} onChange={onTabChange} />
      </div>
      {tabAlerts ? <div className="w-full min-w-0">{tabAlerts}</div> : null}
      <GamesSidePanelToggle open={rightOpen} onToggle={() => setRightOpen(!rightOpen)} />
      <div className={`grid grid-cols-1 gap-8 ${rightOpen ? 'lg:grid-cols-12' : ''}`}>
        <div
          className={`flex min-w-0 flex-col space-y-6 ${rightOpen ? 'lg:col-span-8' : 'lg:col-span-12'}`}
        >
          {main}
        </div>
        {rightOpen ? (
          <aside
            id="kasparex-games-side-panel"
            className="flex min-w-0 max-w-full flex-col space-y-6 lg:col-span-4"
          >
            {sidebar}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
