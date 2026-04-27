'use client';

import { ReactNode } from 'react';
import { GameTabs } from './GameTabs';
import { GameDeckPanel } from '../panels/GameDeckPanel';
import { GameInteractionsPanel } from '../panels/GameInteractionsPanel';
import { GameMetadataPanel } from '../panels/GameMetadataPanel';
import { GamesPlayAdRail } from '../GamesPlayAdRail';

interface UnifiedGameLayoutProps {
  tabs: any[];
  currentTab: string;
  onTabChange: (id: any) => void;
  resources: any[];
  game: {
    name: string;
    featuredImage?: string;
    image?: string;
    connections?: any[];
    categories?: string[];
    tags?: string[];
  };
  children: ReactNode;
  onOpenOverview?: () => void;
  deckFooter?: ReactNode;
  /** Renders below the Game Deck card (e.g. Minecore owned assets). */
  belowDeck?: ReactNode;
  /** Renders under tab bar (dismissible alerts, etc.). */
  tabAlerts?: ReactNode;
}

export function UnifiedGameLayout({
  tabs,
  currentTab,
  onTabChange,
  resources,
  game,
  children,
  onOpenOverview,
  deckFooter,
  belowDeck,
  tabAlerts,
}: UnifiedGameLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="flex flex-col space-y-6 lg:col-span-8">
        <GameTabs tabs={tabs} value={currentTab} onChange={onTabChange} />
        {tabAlerts}
        {children}
      </div>

      <div className="flex flex-col space-y-6 lg:col-span-4">
        <GameDeckPanel
          resources={resources}
          footer={deckFooter}
          featured={{
            image: game.featuredImage || game.image || '',
            onOpenOverview: onOpenOverview || (() => onTabChange('overview')),
            tooltip: 'Game details'
          }}
        />
        {belowDeck}
        <GameInteractionsPanel interactions={game.connections || []} />
        <GameMetadataPanel categories={game.categories || []} tags={game.tags || []} />
        <GamesPlayAdRail />
      </div>
    </div>
  );
}
