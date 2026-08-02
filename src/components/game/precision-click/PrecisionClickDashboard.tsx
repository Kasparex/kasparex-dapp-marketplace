'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { TooltipProvider } from '@/components/ui/Tooltip';
import type { GameDeckResource } from '@/components/games/panels/GameDeckPanel';
import { gameDeckRefineResource } from '@/components/games/panels/GameDeckRefineControls';
import { UnifiedGameLayout } from '@/components/games/layout/UnifiedGameLayout';
import {
  GameOverviewTip,
  GameOverviewTitleBlock,
  GAME_OVERVIEW_ACCENT_LINK,
} from '@/components/games/panels/GameOverviewSections';
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
import { KX_PROSE, KX_PROSE_PARAGRAPH } from '@/lib/ui/kxTypography';

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
  const gameName = props.gameName ?? props.game?.name ?? 'Precision Click: ARIA Lock';
  const description =
    props.gameDescription?.trim() ||
    'Timed cascade on the Kaspa network. Open a 24h ARIA Lock, clear ten seals once each, bank Aria fragments on clear, and refine them into Hub redeem points.';

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
          name: gameName,
          description: props.gameDescription ?? props.game?.description ?? '',
          featuredImage: props.featuredImage || props.game?.featuredImage,
          image: props.game?.image,
          categories,
          tags,
        }}
        deckFooter={
          <span>
            Clear levels to bank Aria fragments. Refine to Hub points. Extend the lock in Shop or with a Sync Operative.
          </span>
        }
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
          <article className={`${KX_PROSE} px-1 pt-6 sm:px-3 lg:px-4`}>
            <GameOverviewTitleBlock
              as="h2"
              kicker="Rewards"
              title="How rewards work"
              subtitle="ARIA Lock clears, Shop tools, and Hub refine points."
            />
            <p className={KX_PROSE_PARAGRAPH}>{description}</p>
            <p className={KX_PROSE_PARAGRAPH}>
              Precision Click is a skill cascade on the Kaspa network. Pay entry to open a 24h lock, clear each of the ten
              levels once, and bank Aria fragments only when a seal clears. Fail and retry that stage. Clear it, and it
              stays sealed for this lock so the same stage cannot be farmed forever.
            </p>
            <GameOverviewTip title="Session tip">
              Clicks only fill the clear meter. Fragments bank on a successful clear (boosters, entry add-ons, and Sync
              Operative perks multiply the bank). Chrono Seals and Sync Operative NFTs extend the lock without wiping
              progress.
            </GameOverviewTip>

            <GameOverviewTitleBlock
              as="h3"
              kicker="Step 1"
              title="Open the lock"
              subtitle="Pay entry, then race the 24h window."
            />
            <p className={KX_PROSE_PARAGRAPH}>
              Use the Calculation breakdown to pay 10 KAS (optional Focus Extension, Fragment Magnet, or Second Chance).
              Paying again starts a fresh lock and resets cleared levels so you can replay the cascade.
            </p>
            <GameOverviewTip title="Entry tip">
              Shop boosters apply while active. Entry add-ons attach to the lock you are about to open. Select them before
              you pay.
            </GameOverviewTip>

            <GameOverviewTitleBlock
              as="h3"
              kicker="Step 2"
              title="Clear &amp; extend"
              subtitle="Hit targets, avoid hazards, keep the chrono window alive."
            />
            <p className={KX_PROSE_PARAGRAPH}>
              Work levels in order. Shard Lens and Null Filter charges from the Shop help on tough seals. Slot a Sync
              Operative NFT below the arena (first slot free; Buy Slot unlocks extras). NFTs already assigned elsewhere
              stay locked here.
            </p>
            <GameOverviewTip title="Operative tip">
              Standard Sync Operatives add +6h. Partner adds +8h with mild perks. Premium (Diamond) adds +12h with stronger
              fragment and miss bonuses.
            </GameOverviewTip>

            <GameOverviewTitleBlock
              as="h3"
              kicker="Step 3"
              title="Refine on Hub"
              subtitle="Turn Aria fragments into redeem points."
            />
            <p className={KX_PROSE_PARAGRAPH}>
              Refine at least 1,000 Aria fragments from the Game Deck into Hub points, then spend them on the Rewards
              catalog when distribution is open.
            </p>
            <GameOverviewTip title="World tip">
              Browse{' '}
              <Link href="/chronicles/chapters" className={GAME_OVERVIEW_ACCENT_LINK}>
                Chronicles chapters
              </Link>{' '}
              and{' '}
              <Link href="/chronicles/characters" className={GAME_OVERVIEW_ACCENT_LINK}>
                character dossiers
              </Link>{' '}
              for ARIA, Krex, Vector, and Tessa lore.
            </GameOverviewTip>

            {props.loreStory?.trim() ? (
              <>
                <GameOverviewTitleBlock as="h3" kicker="Lore" title="From the field" />
                {props.loreStory
                  .trim()
                  .split(/\n\s*\n+/)
                  .map((para) => para.trim())
                  .filter(Boolean)
                  .map((para) => (
                    <p key={para.slice(0, 48)} className={KX_PROSE_PARAGRAPH}>
                      {para}
                    </p>
                  ))}
              </>
            ) : null}
          </article>
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
            operativeSlots={game.state.operativeSlots}
            slotUnlockKas={game.operativeSlotUnlockKas}
            getKasPriceAfterDiscount={game.getKasPriceAfterDiscount}
            onRunningChange={setRoundActive}
            onConsumeItems={game.consumeRunItems}
            onClearLevel={game.clearLevel}
            onSetOperative={game.setOperative}
            onClearOperative={game.clearOperative}
            onPurchaseOperativeSlots={game.purchaseOperativeSlots}
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
