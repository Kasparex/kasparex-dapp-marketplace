'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { TooltipProvider } from '@/components/ui/Tooltip';
import type { GameDeckResource } from '@/components/games/panels/GameDeckPanel';
import { gameDeckRefineResource } from '@/components/games/panels/GameDeckRefineControls';
import { UnifiedGameLayout } from '@/components/games/layout/UnifiedGameLayout';
import { GameOverviewSections } from '@/components/games/panels/GameOverviewSections';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { RewardsPreview } from '@/components/games/modules/RewardsPreview';
import { MilestonesPanel } from '@/components/games/modules/MilestonesPanel';
import { GameActivityStatusDot, type GameActivityHealth } from '@/components/games/GameActivityStatusDot';
import type { GameTab } from '@/components/games/layout/GameTabs';
import {
  IconComments,
  IconMilestones,
  IconOverview,
  IconPlay,
  IconRewards,
  IconShop,
} from '@/components/games/icons/TabIcons';
import { useGameCommentsTabs, gameCommentsArticleId } from '@/components/games/comments/gameComments';
import { useGameMilestones } from '@/hooks/useGameMilestones';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { usePrecisionClick } from '@/hooks/usePrecisionClick';
import { PrecisionClickEntryPanel } from '@/components/game/precision-click/PrecisionClickEntryPanel';
import { PrecisionClickPlayPanel } from '@/components/game/precision-click/PrecisionClickPlayPanel';
import { PrecisionClickShopPanel } from '@/components/game/precision-click/PrecisionClickShopPanel';

const CommentsSection = dynamic(() => import('@/components/vblog/CommentsSection').then((m) => m.CommentsSection), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
      Loading comments…
    </div>
  ),
});

const TABS = [
  { id: 'overview', label: 'Overview', icon: <IconOverview /> },
  { id: 'play', label: 'Play', icon: <IconPlay /> },
  { id: 'shop', label: 'Shop', icon: <IconShop /> },
  { id: 'rewards', label: 'Rewards', icon: <IconRewards /> },
  { id: 'milestones', label: 'Milestones', icon: <IconMilestones /> },
  { id: 'comments', label: 'Comments', icon: <IconComments /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function PrecisionClickDashboard(props: {
  featuredImage?: string;
  loreStory?: string;
  gameDescription?: string;
  gameName?: string;
  game: any;
}) {
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const game = usePrecisionClick();
  const [tab, setTab] = useState<TabId>('play');
  const [refineAmount, setRefineAmount] = useState<number | ''>('');
  const [roundActive, setRoundActive] = useState(false);

  const hasAnyNFT =
    Boolean(nftStatus?.hasKREXPRIME) ||
    Boolean(nftStatus?.hasPIXELKREX) ||
    Boolean(nftStatus?.hasDiamondKREXPRIME) ||
    Boolean(nftStatus?.hasDiamondPIXELKREX) ||
    Boolean(nftStatus?.hasRarestNFT) ||
    Boolean(nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections).some(Boolean));

  const tierMult = tier === 'Tier4' ? 1.25 : tier === 'Tier3' ? 1.15 : tier === 'Tier2' ? 1.1 : 1;
  const tierNftMult = tierMult * (hasAnyNFT ? 1.05 : 1);

  const playHealth: GameActivityHealth = roundActive
    ? 'active'
    : game.state.entryUnlocked
      ? 'inactive'
      : 'exhausted';

  const tabsBase = useGameCommentsTabs(TABS as unknown as GameTab<TabId>[], 'precision-click');
  const tabs = useMemo(
    () =>
      tabsBase.map((t) =>
        t.id === 'play'
          ? {
              ...t,
              rightAdornment: (
                <GameActivityStatusDot
                  health={playHealth}
                  title={
                    roundActive ? 'Round active' : game.state.entryUnlocked ? 'Ready' : 'Entry locked'
                  }
                />
              ),
            }
          : t,
      ),
    [tabsBase, playHealth, roundActive, game.state.entryUnlocked],
  );

  const milestoneProgress = useMemo(
    () => ({
      precision_score: game.state.fragmentsEarnedLifetime,
      precision_levels: game.state.highestClearedLevel,
      refinement_points: game.state.refinementPointsTotal,
    }),
    [game.state.fragmentsEarnedLifetime, game.state.highestClearedLevel, game.state.refinementPointsTotal],
  );
  const { level: playerLevel } = useGameMilestones('precision-click', milestoneProgress);

  const deckResources: GameDeckResource[] = useMemo(
    () => [
      {
        id: 'fragments',
        label: 'Aria fragments',
        value: (
          <span className="inline-flex items-center gap-2 text-lg font-black tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-xl">
            {game.state.ariaFragments.toLocaleString()}
            <GameActivityStatusDot
              health={playHealth}
              title={roundActive ? 'Round active' : game.state.entryUnlocked ? 'Ready' : 'Entry locked'}
            />
          </span>
        ),
        subValue: game.state.entryUnlocked
          ? `Lv ${Math.min(10, game.maxUnlockedLevel)} unlocked`
          : 'Pay entry to play',
        description: 'In-game currency',
        tooltip:
          'Aria fragments earned from precision locks. Refine them into Hub points below. Hazards can reduce a run total before banking.',
        accent: 'games' as const,
        onClick: () => setTab('play'),
      },
      gameDeckRefineResource({
        amount: refineAmount,
        onAmountChange: setRefineAmount,
        minAmount: game.refineMin,
        maxAmount: Math.floor(game.state.ariaFragments),
        refining: game.refining,
        onRefine: (n) => {
          void game.refineFragments(n).then((res) => {
            if (res) setRefineAmount('');
          });
        },
        description: `Min ${game.refineMin} fragments → Hub points on /rewards`,
        tooltip:
          'Enter how many Aria fragments to refine. Each fragment credits exactly 1 Hub redeem point on /rewards. Amount does not auto-follow your live balance.',
      }),
    ],
    [
      game.state.ariaFragments,
      game.state.entryUnlocked,
      game.maxUnlockedLevel,
      game.refineMin,
      game.refining,
      game.refineFragments,
      refineAmount,
      playHealth,
      roundActive,
    ],
  );

  const categories = (props.game?.categories ?? []) as string[];
  const tags = (props.game?.tags ?? []) as string[];

  return (
    <TooltipProvider>
      <UnifiedGameLayout
        tabs={tabs as any}
        currentTab={tab}
        onTabChange={setTab}
        resources={deckResources}
        playerLevel={playerLevel}
        game={{
          ...(props.game ?? {}),
          name: props.gameName ?? props.game?.name ?? 'Precision Click: ARIA Lock',
          description: props.gameDescription ?? props.game?.description ?? '',
          featuredImage: props.featuredImage || props.game?.featuredImage,
          image: props.game?.image,
          categories,
          tags,
        }}
        deckFooter={<span>Earn Aria fragments in Play, refine to Hub points, shop boosters in Shop.</span>}
        asideExtras={
          <PrecisionClickEntryPanel
            entryUnlocked={game.state.entryUnlocked}
            ownedAddons={game.state.ownedAddons}
            booster={game.booster}
            inventory={game.state.inventory}
            paying={game.paying}
            error={game.lastError}
            success={game.lastSuccess}
            getKasPriceAfterDiscount={game.getKasPriceAfterDiscount}
            onPay={game.payEntry}
          />
        }
      >
        {tab === 'overview' && (
          <div className="space-y-6">
            <GamePanelCard title="Training note" hint="Timing and intent.">
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                ARIA fragments do not wait. Ten levels of rising pressure, hazard glyphs, and shop gear. Lock clean
                targets, bank fragments, refine them into Hub points the same way Diamond Veins and Minecore refine
                Diamonds.
              </p>
            </GamePanelCard>

            <GamePanelCard title="How to play" hint="Quick rules.">
              <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Pay the 10 KAS entry (optional add-ons) from the Calculation breakdown rail.</li>
                <li>Clear each level’s fragment goal to unlock the next (10 levels total).</li>
                <li>Base positive click = 10 fragments, then level / booster / add-on multipliers.</li>
                <li>Hazards (Null Glyph, Static Burst) drain fragments. Too many misses ends the run early.</li>
                <li>Buy boosters and items in Shop. Refine fragments to Hub points from the Game Deck.</li>
              </ul>
            </GamePanelCard>

            <GamePanelCard title="References" hint="Worldbuilding links.">
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Browse{' '}
                <Link
                  href="/chronicles/chapters"
                  className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                >
                  Chronicles chapters
                </Link>{' '}
                and{' '}
                <Link
                  href="/chronicles/characters"
                  className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                >
                  character dossiers
                </Link>
                .
              </p>
            </GamePanelCard>

            <GameOverviewSections
              gameName={props.gameName ?? 'Precision Click: ARIA Lock'}
              kicker="Game guide"
              subtitle="Ten-level ARIA Lock reflex training with Aria fragments and Hub refine."
              description={props.gameDescription}
              loreStory={props.loreStory}
              tips={[
                {
                  title: 'Value over speed',
                  body: 'Tessa Marks and Vector Nodes pay more than basic shards. Skipping a Null Glyph is often worth more than a rushed click.',
                },
                {
                  title: 'Stack smart',
                  body: 'Entry add-ons, Shop boosters, KREX tier, and NFT deck bonuses all multiply positive fragment hits.',
                },
              ]}
              flow={[
                'Pay 10 KAS training entry (optional Focus Extension, Fragment Magnet, Second Chance).',
                'Clear timed levels in order. Each clear unlocks the next scenery and harder spawn rules.',
                'Spend KAS or KREX in Shop for boosters and run items.',
                'Refine Aria fragments into Hub points from the Game Deck, then spend them on /rewards.',
              ]}
            />
          </div>
        )}

        {tab === 'play' && (
          <PrecisionClickPlayPanel
            entryUnlocked={game.state.entryUnlocked}
            maxUnlockedLevel={game.maxUnlockedLevel}
            highestClearedLevel={game.state.highestClearedLevel}
            boosterMult={game.boosterMult}
            tierNftMult={tierNftMult}
            addonBundle={game.addonBundle}
            inventory={game.state.inventory}
            onRunningChange={setRoundActive}
            onConsumeItems={game.consumeRunItems}
            onBankRun={(gross, levelId, cleared) => {
              setRoundActive(false);
              game.bankRunFragments(gross, levelId, cleared);
            }}
          />
        )}

        {tab === 'shop' && (
          <PrecisionClickShopPanel
            inventory={game.state.inventory}
            booster={game.booster}
            buyBusyId={game.buyBusyId}
            getKasPriceAfterDiscount={game.getKasPriceAfterDiscount}
            onBuy={game.buyShopItem}
          />
        )}

        {tab === 'rewards' && <RewardsPreview showLink={true} />}

        {tab === 'milestones' && (
          <MilestonesPanel
            gameId="precision-click"
            progress={milestoneProgress}
            kicker="Progress"
            title="Milestones"
            subtitle="Lifetime fragments and cleared levels raise your Player level."
          />
        )}

        {tab === 'comments' && (
          <CommentsSection articleId={gameCommentsArticleId('precision-click')} dappSectionHeader />
        )}
      </UnifiedGameLayout>
    </TooltipProvider>
  );
}
