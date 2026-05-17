'use client';

import type { ReactNode } from 'react';
import { GameDeckPanel } from '../panels/GameDeckPanel';
import { GameInteractionsPanel } from '../panels/GameInteractionsPanel';
import { GameMetadataPanel } from '../panels/GameMetadataPanel';
import { GamesPlayAdRail } from '../GamesPlayAdRail';
import { GamesWithSidebarLayout } from './GamesWithSidebarLayout';

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
    categories?: any[];
    tags?: any[];
  };
  children: ReactNode;
  onOpenOverview?: () => void;
  deckFooter?: ReactNode;
  deckFeaturedTooltip?: string;
  showDeckInfoButton?: boolean;
  belowDeck?: ReactNode;
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
  deckFeaturedTooltip,
  showDeckInfoButton,
  belowDeck,
  tabAlerts,
}: UnifiedGameLayoutProps) {
  const sidebar = (
    <>
      <GameDeckPanel
        resources={resources}
        footer={deckFooter}
        featured={{
          image: game.featuredImage || game.image || '',
          onOpenOverview: onOpenOverview || (() => onTabChange('overview')),
          tooltip: deckFeaturedTooltip ?? 'Game details',
        }}
        showDeckHelpButton={showDeckInfoButton !== false}
      />
      {belowDeck}
      <GameInteractionsPanel interactions={game.connections || []} />
      <GameMetadataPanel categories={game.categories || []} tags={game.tags || []} />
      <GamesPlayAdRail />
    </>
  );

  return (
    <GamesWithSidebarLayout
      tabs={tabs}
      currentTab={currentTab}
      onTabChange={onTabChange}
      tabAlerts={tabAlerts}
      main={children}
      sidebar={sidebar}
    />
  );
}
