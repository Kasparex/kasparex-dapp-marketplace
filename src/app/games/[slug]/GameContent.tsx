'use client';

import { useState, useMemo } from 'react';
import { UnifiedGameLayout } from '@/components/games/layout/UnifiedGameLayout';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import { IconOverview, IconRewards, IconShop, IconComments } from '@/components/games/icons/TabIcons';
import { GameOverviewSections } from '@/components/games/panels/GameOverviewSections';
import { RewardsRedeemSection } from '@/components/games/RewardsRedeemSection';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import type { Game } from '@/lib/games/games';

const BASE_TABS = [
  { id: 'overview', label: 'Overview', icon: <IconOverview /> },
  { id: 'play', label: 'Play', icon: <DiamondIcon className="h-4 w-4 text-sky-400" /> },
  { id: 'rewards', label: 'Redeem', icon: <IconRewards /> },
  { id: 'comments', label: 'Comments', icon: <IconComments /> },
] as const;

type TabId = (typeof BASE_TABS)[number]['id'] | 'shop';

export function GameContent({ game }: { game: Game }) {
  const [tab, setTab] = useState<TabId>('overview');
  const { state: walletState } = useKaspaWallet();
  const { l1Balance: krexL1Balance, tier: krexTier } = useKREXBalance();
  const { balanceInKas, isLoading: kasLoading } = useKaspaBalance();
  
  const [mockDiamonds, setMockDiamonds] = useState(0);
  const [mockPoints, setMockPoints] = useState(0);

  const resources = useMemo(() => [
    {
      id: 'reward_weight',
      label: 'Reward Weight',
      value: (mockDiamonds + mockPoints).toLocaleString(),
      subValue: `${mockDiamonds.toLocaleString()} Diamonds + ${mockPoints.toLocaleString()} Points`,
      description: 'Combined reward potential',
      tooltip: 'Your total reward weight across Kasparex Games.',
      accent: 'diamonds' as const,
      icon: <DiamondIcon className="h-4 w-4 text-sky-400" />,
      onClick: () => setTab('rewards'),
    },
    {
      id: 'kas',
      label: 'KAS',
      value: (kasLoading ? 0 : (balanceInKas ?? 0)).toLocaleString(undefined, { maximumFractionDigits: 4 }),
      description: 'Main fuel currency',
      tooltip: 'Your Kaspa L1 balance.',
      accent: 'kas' as const,
      onClick: () => {},
    },
    {
      id: 'krex',
      label: 'KREX',
      value: krexL1Balance.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      description: 'Utility token',
      tooltip: `Your KREX balance. Tier: ${krexTier}`,
      accent: 'krex' as const,
      onClick: () => {},
    }
  ], [mockDiamonds, mockPoints, balanceInKas, kasLoading, krexL1Balance, krexTier]);

  const tabs = useMemo(() => {
    const list = [...BASE_TABS];
    if (game.shopItems?.length) {
      list.splice(2, 0, { id: 'shop', label: 'Shop', icon: <IconShop /> } as any);
    }
    return list;
  }, [game.shopItems]);

  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:px-16 lg:py-12">
      <UnifiedGameLayout
        tabs={tabs as any}
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
          <CommentsSection articleId={`game:${game.slug || game.id}`} />
        )}
      </UnifiedGameLayout>
    </main>
  );
}
