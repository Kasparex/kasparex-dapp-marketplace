'use client';

import type { ReactNode } from 'react';
import { GameTabs } from './GameTabs';
import { useGamesRightPanelOpen } from '@/hooks/useGamesRightPanelOpen';
import { HubPageRightPanelGrid, HubPageRightPanelToggle } from '@/components/hub/HubPageRightPanel';
import { GamesLayoutProvider } from './GamesLayoutContext';
import { HubAccentScope } from '@/components/hub/HubAccentScope';

type Props = {
  tabs: readonly any[];
  currentTab: string;
  onTabChange: (id: any) => void;
  tabAlerts?: ReactNode;
  /** Halo header rendered above the tab strip (individual game pages). */
  haloHeader?: ReactNode;
  main: ReactNode;
  sidebar: ReactNode;
};

/**
 * Matches Tokens page stack: header (own mb-10) then equal gap-6 between tabs and content.
 */
export function GamesWithSidebarLayout({
  tabs,
  currentTab,
  onTabChange,
  tabAlerts,
  haloHeader,
  main,
  sidebar,
}: Props) {
  const [rightOpen, setRightOpen] = useGamesRightPanelOpen(true);

  return (
    <HubAccentScope projectId="kasparex-games" className="w-full min-w-0">
      <GamesLayoutProvider rightPanelOpen={rightOpen}>
        {haloHeader ? <div className="w-full min-w-0">{haloHeader}</div> : null}

        <div className="flex w-full min-w-0 flex-col gap-6">
          <div className="mb-2 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
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
            gridClassName="grid grid-cols-1 gap-8 xl:gap-10"
            hideToggle
          >
            {main}
          </HubPageRightPanelGrid>
        </div>
      </GamesLayoutProvider>
    </HubAccentScope>
  );
}
