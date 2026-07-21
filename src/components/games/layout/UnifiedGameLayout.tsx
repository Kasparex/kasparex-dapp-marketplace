'use client';

import type { ReactNode } from 'react';
import type { Game } from '@/lib/games/games';
import { GameDeckPanel } from '../panels/GameDeckPanel';
import { GameInteractionsPanel } from '../panels/GameInteractionsPanel';
import { GameMetadataPanel } from '../panels/GameMetadataPanel';
import { GamesPlayAdRail } from '../GamesPlayAdRail';
import { GamesWithSidebarLayout } from './GamesWithSidebarLayout';
import { GamesHaloHeader } from '../GamesHaloHeader';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';

/** Partial game payloads from play dashboards (e.g. Diamond Veins) plus full registry games. */
export type UnifiedGameLayoutGame = Partial<Game> & {
  name: string;
  connections?: any[];
  categories?: any[];
  tags?: any[];
};

interface UnifiedGameLayoutProps {
  tabs: any[];
  currentTab: string;
  onTabChange: (id: any) => void;
  resources: any[];
  game: UnifiedGameLayoutGame;
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
  const haloGame = {
    name: game.name,
    description: game.description ?? '',
    developer: game.developer ?? 'Kasparex',
    status: game.status ?? ('active' as const),
    difficulty: game.difficulty ?? ('medium' as const),
    gameType: game.gameType ?? ('arcade' as const),
    featuredImage: game.featuredImage,
    image: game.image,
    entryCostKAS: game.entryCostKAS ?? 0,
    version: game.version,
  };

  const sidebar = (
    <>
      <HubBenefitsPanel variant="panel" className="w-full" />
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
      haloHeader={<GamesHaloHeader game={haloGame} />}
      main={children}
      sidebar={sidebar}
    />
  );
}
