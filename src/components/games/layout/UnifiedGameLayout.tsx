'use client';

import type { ReactNode } from 'react';
import type { Game } from '@/lib/games/games';
import type { GameDeckResource } from '../panels/GameDeckPanel';
import { GameMetadataPanel } from '../panels/GameMetadataPanel';
import { GamesPlayAdRail } from '../GamesPlayAdRail';
import { GamesWithSidebarLayout } from './GamesWithSidebarLayout';
import { GamesHaloHeader } from '../GamesHaloHeader';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { GamesSecurityPanel } from '@/components/games/panels/GamesSecurityPanel';

/** Partial game payloads from play dashboards (e.g. Diamond Veins) plus full registry games. */
export type UnifiedGameLayoutGame = Partial<Game> & {
  name: string;
  categories?: any[];
  tags?: any[];
  capabilities?: import('@/lib/games/registry').GameCapability[];
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
  /** Milestone player level shown in the game header badge row. */
  playerLevel?: number;
}

export function UnifiedGameLayout({
  tabs,
  currentTab,
  onTabChange,
  resources,
  game,
  children,
  belowDeck,
  deckFooter,
  playerLevel,
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
    version: game.version,
    publisher: game.publisher,
    authorAddress: game.authorAddress,
    categories: game.categories,
    tags: game.tags,
    capabilities: game.capabilities,
  };

  const sidebar = (
    <div className="flex flex-col gap-4">
      <HubBenefitsPanel variant="panel" scope="games" className="w-full" />
      {belowDeck}
      <GamesSecurityPanel />
      <GameMetadataPanel categories={game.categories || []} tags={game.tags || []} />
      <GamesPlayAdRail />
    </div>
  );

  return (
    <GamesWithSidebarLayout
      tabs={tabs}
      currentTab={currentTab}
      onTabChange={onTabChange}
      haloHeader={
        <GamesHaloHeader game={haloGame} resources={resources} deckFooter={deckFooter} playerLevel={playerLevel} />
      }
      main={children}
      sidebar={sidebar}
    />
  );
}
