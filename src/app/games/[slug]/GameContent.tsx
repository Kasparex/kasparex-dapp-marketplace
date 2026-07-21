'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { UnifiedGameLayout } from '@/components/games/layout/UnifiedGameLayout';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import { IconOverview, IconRewards, IconShop, IconComments, IconBoosters } from '@/components/games/icons/TabIcons';
import { GameOverviewSections } from '@/components/games/panels/GameOverviewSections';
import { RewardsRedeemSection } from '@/components/games/RewardsRedeemSection';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { useGameCommentsTabs, gameCommentsArticleId } from '@/components/games/comments/gameComments';
import type { Game } from '@/lib/games/games';
import type { UnifiedGame } from '@/lib/games/registry';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { GameItemCard } from '@/components/games/shop/GameItemCard';

const BASE_TABS = [
  { id: 'overview', label: 'Overview', icon: <IconOverview /> },
  { id: 'play', label: 'Play', icon: <DiamondIcon className="h-4 w-4 text-sky-400" /> },
  { id: 'rewards', label: 'Redeem', icon: <IconRewards /> },
  { id: 'comments', label: 'Comments', icon: <IconComments /> },
] as const;

type TabId = (typeof BASE_TABS)[number]['id'] | 'shop' | 'boosters';

export function GameContent({ game: baseGame }: { game: Game }) {
  const game = baseGame as UnifiedGame;
  const [tab, setTab] = useState<TabId>('overview');
  
  const [mockDiamonds, setMockDiamonds] = useState(0);
  const [mockPoints, setMockPoints] = useState(0);

  // Sorting/Filtering state for Shop/Boosters
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  const resources = useMemo(() => [
    {
      id: 'diamonds',
      label: 'In-game currency',
      value: mockDiamonds.toLocaleString(),
      subValue: 'Diamonds',
      description: 'Game currency',
      tooltip: 'Your in-game currency across Kasparex Games.',
      accent: 'diamonds' as const,
      icon: <DiamondIcon className="h-4 w-4 text-sky-400" />,
      onClick: () => setTab('rewards'),
    },
    {
      id: 'redeem_points',
      label: 'Redeem points',
      value: mockPoints.toLocaleString(),
      description: 'Redeemable points',
      tooltip: 'Redeemable points earned from gameplay.',
      accent: 'purple' as const,
      onClick: () => setTab('rewards'),
    },
  ], [mockDiamonds, mockPoints]);

  const hasBoosters = game.skus?.some(s => s.type === 'boost');
  const hasShop = game.shopItems?.length || game.skus?.some(s => s.type !== 'entry' && s.type !== 'boost');

  const tabs = useMemo(() => {
    const list = [...BASE_TABS];
    if (hasBoosters) {
      list.splice(2, 0, { id: 'boosters', label: 'Boosters', icon: <IconBoosters /> } as any);
    }
    if (hasShop) {
      list.splice(hasBoosters ? 3 : 2, 0, { id: 'shop', label: 'Shop', icon: <IconShop /> } as any);
    }
    return list;
  }, [hasBoosters, hasShop]);

  const articleSlug = game.slug || game.id;
  const tabsWithComments = useGameCommentsTabs(tabs as any, articleSlug);

  const shopItems = useMemo(() => {
    const items: any[] = [];
    if (game.shopItems) items.push(...game.shopItems);
    if (game.skus) {
      game.skus.filter(s => s.type !== 'entry').forEach(sku => {
        items.push({
          id: sku.id,
          title: sku.title,
          category: sku.type.charAt(0).toUpperCase() + sku.type.slice(1),
          priceOptions: [{ currency: sku.currency, unitPrice: sku.amount }],
          description: `Game specific ${sku.type}.`,
          type: sku.type
        });
      });
    }
    return items;
  }, [game.shopItems, game.skus]);

  const filteredItems = useMemo(() => {
    let list = shopItems;
    if (tab === 'boosters') list = list.filter(i => i.type === 'boost');
    
    return list.filter(item => {
      if (category !== 'all' && item.category?.toLowerCase() !== category.toLowerCase()) return false;
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return (a.priceOptions?.[0]?.unitPrice ?? 0) - (b.priceOptions?.[0]?.unitPrice ?? 0);
      if (sortBy === 'price_desc') return (b.priceOptions?.[0]?.unitPrice ?? 0) - (a.priceOptions?.[0]?.unitPrice ?? 0);
      return 0;
    });
  }, [shopItems, tab, searchQuery, category, sortBy]);

  const categories = useMemo(() => Array.from(new Set(shopItems.map(i => i.category).filter(Boolean))), [shopItems]);

  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:px-16 lg:py-12">
      <div className="mb-6">
        <Link
          href="/games"
          className="group inline-flex items-center gap-2 text-base font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          <svg
            className="h-5 w-5 transform transition-transform group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Games
        </Link>
      </div>
      <UnifiedGameLayout
        tabs={tabsWithComments as any}
        currentTab={tab}
        onTabChange={setTab}
        resources={resources}
        game={game as any}
        deckFooter={<span>Unified Rewards & Game Engine. Play to earn Diamonds.</span>}
      >
        {tab === 'overview' && (
          <GameOverviewSections
            gameName={game.name}
            description={game.description}
            loreStory={game.instructions}
            featuredImage={game.featuredImage || game.image}
            flow={[
              'Play the game to earn Diamonds.',
              'Diamonds are automatically refined into Points.',
              'Claim your Points as real Tokens on the L2 network.',
            ]}
          />
        )}

        {tab === 'play' && (
          <div className="space-y-6">
            {game.gameUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 shadow-inner flex items-center justify-center">
                <iframe 
                  src={game.gameUrl} 
                  className="w-full h-full border-0" 
                  title={game.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Coming Soon</h3>
                <p className="mt-2 text-zinc-500">This game is currently in development.</p>
              </div>
            )}
          </div>
        )}

        {(tab === 'shop' || tab === 'boosters') && (
          <div className="space-y-6">
            <CardsFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              category={category}
              onCategoryChange={setCategory}
              categories={categories}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map(item => (
                <GameItemCard
                  key={item.id}
                  title={item.title}
                  category={item.category}
                  description={item.description}
                  priceOptions={item.priceOptions}
                  onBuy={() => alert(`Buying ${item.title}... (Demo)`)}
                />
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-zinc-500">No items match your filters.</div>
              )}
            </div>
          </div>
        )}

        {tab === 'rewards' && (
          <RewardsRedeemSection
            diamondsBalance={mockDiamonds}
            refinementPointsBalance={mockPoints}
            onRefine={(amt) => {
              setMockDiamonds(d => d - amt);
              setMockPoints(p => p + amt);
            }}
            onRedeem={(pts) => {
              setMockPoints(p => p - pts);
            }}
          />
        )}

        {tab === 'comments' && (
          <CommentsSection articleId={gameCommentsArticleId(articleSlug)} dappSectionHeader />
        )}
      </UnifiedGameLayout>
    </main>
  );
}
