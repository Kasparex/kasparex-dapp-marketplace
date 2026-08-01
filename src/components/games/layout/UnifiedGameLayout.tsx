'use client';

import type { ReactNode } from 'react';
import type { Game } from '@/lib/games/games';
import type { GameDeckResource } from '../panels/GameDeckPanel';
import { GameMetadataPanel } from '../panels/GameMetadataPanel';
import { GamesWithSidebarLayout } from './GamesWithSidebarLayout';
import { GamesHaloHeader } from '../GamesHaloHeader';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { GamesSecurityPanel } from '@/components/games/panels/GamesSecurityPanel';
import { GamesAsideRail } from '@/components/games/layout/GamesAsideRail';

/** Partial game payloads from play dashboards (e.g. Diamond Veins) plus full registry games. */
export type UnifiedGameLayoutGame = Partial<Game> & {
  name: string;
  id?: string;
  slug?: string;
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
  /** Milestone player level shown in the game header badge row. */
  playerLevel?: number;
  /** Extra aside panels (e.g. Calculation breakdown for paid entry games). */
  asideExtras?: ReactNode;
}

export function UnifiedGameLayout({
  tabs,
  currentTab,
  onTabChange,
  resources,
  game,
  children,
  deckFooter,
  playerLevel,
  asideExtras,
}: UnifiedGameLayoutProps) {
  const haloGame = {
    id: game.id ?? game.slug ?? game.name,
    name: game.name,
    slug: game.slug ?? game.id ?? '',
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
    <GamesAsideRail>
      <HubBenefitsPanel variant="panel" scope="games" className="w-full" />
      {asideExtras}
      <GameMetadataPanel categories={game.categories || []} tags={game.tags || []} />
      <GamesSecurityPanel />
    </GamesAsideRail>
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
