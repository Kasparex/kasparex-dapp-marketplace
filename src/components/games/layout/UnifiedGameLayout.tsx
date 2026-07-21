'use client';

import type { ReactNode } from 'react';
import type { Game } from '@/lib/games/games';
import type { GameDeckResource } from '../panels/GameDeckPanel';
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
  resources: GameDeckResource[];
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
  belowDeck,
  tabAlerts,
  deckFooter,
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
    <div className="flex flex-col gap-4">
      <HubBenefitsPanel variant="panel" className="w-full" />
      {belowDeck}
      <GameInteractionsPanel interactions={game.connections || []} />
      <GameMetadataPanel categories={game.categories || []} tags={game.tags || []} />
      <GamesPlayAdRail />
    </div>
  );

  return (
    <GamesWithSidebarLayout
      tabs={tabs}
      currentTab={currentTab}
      onTabChange={onTabChange}
      tabAlerts={tabAlerts}
      haloHeader={<GamesHaloHeader game={haloGame} resources={resources} deckFooter={deckFooter} />}
      main={children}
      sidebar={sidebar}
    />
  );
}
