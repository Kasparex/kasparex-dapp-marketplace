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
    : game.runActive
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
                  title={roundActive ? 'Level active' : game.runActive ? 'Lock open' : 'Lock closed'}
                />
              ),
            }
          : t,
      ),
    [tabsBase, playHealth, roundActive, game.runActive],
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

  const refineFragments = game.refineFragments;
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
              title={roundActive ? 'Level active' : game.runActive ? 'Lock open' : 'Lock closed'}
            />
          </span>
        ),
        subValue: game.runActive
          ? `Lv ${Math.min(10, Math.max(1, game.maxUnlockedLevel))} · lock open`
          : 'Pay entry to open lock',
        description: 'In-game currency',
        tooltip:
          'Aria fragments are banked only when you clear a level. Cleared levels cannot be farmed again until the 24h lock expires or you pay a new entry. Refine below into Hub points.',
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
          void refineFragments(n).then((res) => {
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
      game.runActive,
      game.maxUnlockedLevel,
      game.refineMin,
      game.refining,
      refineFragments,
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
        deckFooter={<span>Clear levels to bank Aria fragments. Refine to Hub points. Extend the lock in Shop or with a Sync Operative.</span>}
        asideExtras={
          <PrecisionClickEntryPanel
            entryUnlocked={game.runActive}
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
            <GamePanelCard title="Story" hint="ARIA Lock.">
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                The Null Gang flooded the old lock grid with static. ARIA still answers, but only in short, precise
                windows. Krex marks the traces, Vector fights calibration drift, and Tessa opens stealth gaps when the
                glyphs turn hostile. Your job is not practice. You open a paid lock, clear ten cascading seals before the
                chrono window dies, and bank real Aria fragments for Hub refine. Fail a level and you keep trying that seal.
                Clear it, and it stays sealed for this lock so nobody farms the same stage forever.
              </p>
            </GamePanelCard>

            <GamePanelCard title="How to play" hint="Fair lock rules.">
              <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Pay 10 KAS to open a 24h lock (optional entry add-ons on the Calculation breakdown).</li>
                <li>Clicks only fill level progress. Aria fragments bank only when you clear a level.</li>
                <li>Cleared levels stay locked until the timer ends or you pay entry again for a fresh lock.</li>
                <li>Extend time with Chrono Seals in Shop or slot a Sync Operative NFT below the arena.</li>
                <li>Refine at least 1,000 Aria fragments into Hub points from the Game Deck.</li>
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
              subtitle="Timed 10-level cascade. Bank fragments on clear. Refine to Hub points."
              description={props.gameDescription}
              loreStory={props.loreStory}
              tips={[
                {
                  title: 'Progress vs payout',
                  body: 'Clicks push the clear meter. Only a successful clear pays the level bank reward (multiplied by boosters, add-ons, and Sync Operative perks).',
                },
                {
                  title: 'Beat the clock',
                  body: 'If the 24h lock expires, cleared levels reset and you must pay entry again. Chrono Seals extend without wiping progress.',
                },
              ]}
              flow={[
                'Pay 10 KAS to open the lock and start the 24h window.',
                'Clear levels in order. Each clear banks fragments and locks that stage for this run.',
                'Extend with Chrono Seals or a Sync Operative NFT. Buy lenses and filters in Shop.',
                'Refine Aria fragments (min 1,000) into Hub points from the Game Deck.',
              ]}
            />
          </div>
        )}

        {tab === 'play' && (
          <PrecisionClickPlayPanel
            entryUnlocked={game.state.entryUnlocked}
            runActive={game.runActive}
            runMsLeft={game.runMsLeft}
            maxUnlockedLevel={game.maxUnlockedLevel}
            highestClearedLevel={game.state.highestClearedLevel}
            clearedLevels={game.state.clearedLevels}
            boosterMult={game.boosterMult}
            tierNftMult={tierNftMult}
            addonBundle={game.addonBundle}
            inventory={game.state.inventory}
            operative={game.state.operative}
            onRunningChange={setRoundActive}
            onConsumeItems={game.consumeRunItems}
            onClearLevel={game.clearLevel}
            onSetOperative={game.setOperative}
            onClearOperative={game.clearOperative}
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
