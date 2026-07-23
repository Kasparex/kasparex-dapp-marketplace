'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useDiamondMining } from '@/hooks/useDiamondMining';
import { GameTooltipProvider } from '@/components/game/diamond-veins/GameTooltip';
import { OverviewPanel } from '@/components/game/diamond-veins/panels/OverviewPanel';
import { MiningPanel } from '@/components/game/diamond-veins/panels/MiningPanel';
import { UpgradesPanel } from '@/components/game/diamond-veins/panels/UpgradesPanel';
import { RewardsPanel } from '@/components/game/diamond-veins/panels/RewardsPanel';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import { GameOverviewSections } from '@/components/games/panels/GameOverviewSections';
import { gameDeckRefineResource } from '@/components/games/panels/GameDeckRefineControls';
import {
  IconComments,
  IconMilestones,
  IconOverview,
  IconRewards,
  IconShop,
} from '@/components/games/icons/TabIcons';
import { UnifiedGameLayout } from '@/components/games/layout/UnifiedGameLayout';
import type { GameTab } from '@/components/games/layout/GameTabs';
import { useGameCommentsTabs, gameCommentsArticleId } from '@/components/games/comments/gameComments';
import { MilestonesPanel } from '@/components/games/modules/MilestonesPanel';
import { useGameMilestones } from '@/hooks/useGameMilestones';
import { GameActivityStatusDot, type GameActivityHealth } from '@/components/games/GameActivityStatusDot';

function resolveMiningHealth(
  stats: { slots: { status: string }[] },
  slots: { nftId: number | null }[],
): GameActivityHealth {
  const hasWorker = slots.some((s) => s.nftId != null);
  if (!hasWorker) return 'inactive';
  if (stats.slots.some((s) => s.status === 'mining')) return 'active';
  return 'exhausted';
}

type TabId = 'overview' | 'mining' | 'upgrades' | 'rewards' | 'milestones' | 'comments';

const TABS: GameTab<TabId>[] = [
  { id: 'overview', label: 'Overview', icon: <IconOverview /> },
  { id: 'mining', label: 'Mining', icon: <DiamondIcon className="h-4 w-4 text-sky-400" /> },
  { id: 'upgrades', label: 'Shop', icon: <IconShop /> },
  { id: 'rewards', label: 'Rewards', icon: <IconRewards /> },
  { id: 'milestones', label: 'Milestones', icon: <IconMilestones /> },
  { id: 'comments', label: 'Comments', icon: <IconComments /> },
];

const CommentsSection = dynamic(() => import('@/components/vblog/CommentsSection').then((m) => m.CommentsSection), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
      Loading comments…
    </div>
  ),
});

interface MiningDashboardProps {
  featuredImage?: string;
  loreStory?: string;
  gameDescription?: string;
  game?: any;
  gameName?: string;
}

export function MiningDashboard({
  featuredImage = '',
  loreStory = '',
  gameDescription = '',
  game,
  gameName,
}: MiningDashboardProps) {
  const { state: walletState } = useKaspaWallet();

  const {
    tycon,
    diamonds,
    slots,
    stats,
    activeBoosts,
    deployNFT,
    removeSlot,
    purchaseNftDeckSlot,
    slotPurchaseKasByType,
    refineDiamonds,
    buyBoost,
    buyBoostWithKAS,
    buyConsumable,
    feedWorker,
    consumables,
    slottedMetadata,
    krexL1Balance,
    kasBalance,
    krexTier,
    getKasPriceAfterDiscount,
    refineMinDiamonds,
    revenuePoolPct,
    buyingItemId,
    canPayWithL1,
    refinementPointsTotal,
    diamondsEarnedLifetime,
    lastRefineClaim,
    clearLastRefineClaim,
    kasBalanceLoading,
    miningAllowed,
    reconnectRequiredBy,
    gridLedger,
    profileNotice,
  } = useDiamondMining();

  const [tab, setTab] = useState<TabId>('overview');
  const [faqOpen, setFaqOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const [refineAmount, setRefineAmount] = useState<number | ''>('');

  const runRefine = async (amount: number) => {
    if (amount < refineMinDiamonds || refining) return;
    setRefining(true);
    try {
      await refineDiamonds(amount);
      setRefineAmount('');
    } finally {
      setRefining(false);
    }
  };

  const categories = (game?.categories ?? []) as string[];
  const tags = (game?.tags ?? []) as string[];

  const openOverview = () => {
    setTab('overview');
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // ignore
    }
  };

  const tabsBase = useGameCommentsTabs(TABS, 'diamond-veins');

  const miningHealth = useMemo(() => resolveMiningHealth(stats, slots), [stats, slots]);

  const tabsWithComments = useMemo(
    () =>
      tabsBase.map((t) =>
        t.id === 'mining'
          ? {
              ...t,
              rightAdornment: (
                <GameActivityStatusDot
                  health={miningHealth}
                  title={
                    miningHealth === 'active'
                      ? 'Mining active'
                      : miningHealth === 'exhausted'
                        ? 'Workers exhausted'
                        : 'Mining inactive'
                  }
                />
              ),
            }
          : t,
      ),
    [tabsBase, miningHealth],
  );

  const milestoneProgress = useMemo(
    () => ({
      diamonds_earned: diamondsEarnedLifetime,
      diamonds_balance: diamonds,
      slots_unlocked: slots.length,
      refinement_points: refinementPointsTotal,
    }),
    [diamondsEarnedLifetime, diamonds, slots.length, refinementPointsTotal],
  );
  const { level: playerLevel } = useGameMilestones('diamond-veins', milestoneProgress);

  const deckResources = useMemo(
    () => [
      {
        id: 'diamonds',
        label: 'Diamonds',
        value: (
          <span className="inline-flex items-center gap-2 text-lg font-black tabular-nums tracking-tight text-blue-500 dark:text-blue-400 sm:text-xl">
            {Math.floor(diamonds).toLocaleString()}
            <GameActivityStatusDot
              health={miningHealth}
              title={
                miningHealth === 'active'
                  ? 'Mining active'
                  : miningHealth === 'exhausted'
                    ? 'Workers exhausted'
                    : 'Mining inactive'
              }
            />
          </span>
        ),
        subValue: (
          <>
            <span className="font-semibold tabular-nums">{(stats.yieldPerSecond * 60).toFixed(2)}</span>
            <span className="font-bold text-zinc-500 dark:text-zinc-400"> D/min</span>
          </>
        ),
        description: 'In-game currency',
        tooltip:
          'Diamonds mined by NFT workers. Status dot: green = mining, orange = exhausted, red = inactive. Subtext is live total D/min.',
        accent: 'diamonds' as const,
        icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" />,
        onClick: () => setTab('mining'),
      },
      gameDeckRefineResource({
        amount: refineAmount,
        onAmountChange: setRefineAmount,
        minAmount: refineMinDiamonds,
        maxAmount: Math.floor(diamonds),
        refining,
        onRefine: (n) => {
          void runRefine(n);
        },
        description: `Min ${refineMinDiamonds} Diamonds → Hub points on /rewards`,
      }),
    ],
    [diamonds, stats.yieldPerSecond, miningHealth, refineMinDiamonds, refineAmount, refining],
  );

  return (
    <GameTooltipProvider>
      <div className="flex flex-col space-y-6">
        {reconnectRequiredBy && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-medium text-amber-800 dark:text-amber-200">
            Connect a Kaspa wallet once to bind this browser profile. After that, idle mining can continue when you return.
          </div>
        )}

        {profileNotice && (
          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3 text-sm font-medium text-sky-900 dark:text-sky-100">
            {profileNotice}
          </div>
        )}

        <UnifiedGameLayout
          tabs={tabsWithComments as any}
          currentTab={tab}
          onTabChange={setTab}
          playerLevel={playerLevel}
          resources={deckResources}
          game={{
            ...(game ?? {}),
            name: gameName ?? game?.name ?? 'Diamond Veins',
            description: gameDescription || game?.description || '',
            featuredImage: featuredImage || game?.featuredImage,
            image: game?.image,
            categories,
            tags,
          }}
          onOpenOverview={openOverview}
          deckFooter={<span>Refine Diamonds into Hub points on /rewards</span>}
        >
          <div className="flex w-full min-w-0 flex-col gap-6">
          {purchaseSuccess && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/20 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              Purchase complete. &quot;{purchaseSuccess}&quot; is now active.
            </div>
          )}

          {tab === 'overview' && (
            <div className="space-y-6">
              <OverviewPanel tycon={tycon} stats={stats} />
              <GameOverviewSections
                gameName={gameName ?? 'Diamond Veins'}
                description={gameDescription}
                loreStory={loreStory}
                featuredImage={featuredImage || undefined}
                flow={[
                  'Deploy an NFT into your free starter Worker slot to begin idle Diamond mining.',
                  'Buy extra slots to scale capacity. Higher NFT tiers and KREX tiers mine faster.',
                  'Feed exhausted workers from the Shop. Refine Diamonds from the Game Deck into Hub points on /rewards.',
                ]}
              />
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40">
                <button
                  type="button"
                  onClick={() => setFaqOpen((o) => !o)}
                  className="flex w-full items-center justify-between p-5 text-left text-lg font-semibold text-zinc-900 transition-colors hover:bg-zinc-100/80 dark:text-zinc-100 dark:hover:bg-zinc-800/50 sm:p-6"
                >
                  FAQ & How rewards work
                  <svg
                    className={`h-5 w-5 transition-transform ${faqOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {faqOpen ? (
                  <div className="space-y-5 border-t border-zinc-200 px-5 pb-5 pt-4 text-lg leading-8 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 sm:px-6">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">Tabs overview</p>
                      <p className="mt-2">
                        <strong className="text-zinc-900 dark:text-zinc-100">Mining</strong> holds NFT worker slots.{' '}
                        <strong className="text-zinc-900 dark:text-zinc-100">Shop</strong> sells food, drinks, repair
                        kits, and boosts. <strong className="text-zinc-900 dark:text-zinc-100">Rewards</strong> shows
                        refine history toward Hub points.{' '}
                        <strong className="text-zinc-900 dark:text-zinc-100">Milestones</strong> track long-term goals.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">Hub Points</p>
                      <p className="mt-2">
                        Refine from the Game Deck to credit{' '}
                        <Link href="/rewards" className="font-semibold text-[#02abb8] hover:underline">
                          Rewards & Points
                        </Link>
                        , same bridge as Minecore.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          {tab === 'mining' && (
            <MiningPanel
              tycon={tycon}
              stats={stats}
              diamonds={diamonds}
              slottedMetadata={slottedMetadata}
              onDeploy={deployNFT}
              onRemove={removeSlot}
              onPurchaseExtraSlot={purchaseNftDeckSlot}
              slotPurchaseKasByType={slotPurchaseKasByType}
              miningAllowed={miningAllowed}
              consumables={consumables}
              onFeedWorker={feedWorker}
              activeBoosts={activeBoosts}
              krexTier={krexTier}
            />
          )}
          {tab === 'upgrades' && (
            <UpgradesPanel
              canPayWithL1={canPayWithL1}
              krexL1Balance={krexL1Balance}
              kasBalance={kasBalance}
              kasBalanceLoading={kasBalanceLoading}
              krexTier={krexTier}
              getKasPriceAfterDiscount={getKasPriceAfterDiscount}
              buyingItemId={buyingItemId}
              revenuePoolPct={revenuePoolPct}
              consumables={consumables}
              onBuyKrex={async (item, quantity) => {
                try {
                  await buyBoost(item.id, item.name, item.price, item.type, item.mult, quantity);
                  setPurchaseSuccess(item.name);
                  setTimeout(() => setPurchaseSuccess(null), 5000);
                } catch {
                  /* */
                }
              }}
              onBuyKas={async (item, quantity) => {
                try {
                  await buyBoostWithKAS(item.id, item.name, item.priceKAS, item.type, item.mult, quantity);
                  setPurchaseSuccess(item.name);
                  setTimeout(() => setPurchaseSuccess(null), 5000);
                } catch {
                  /* */
                }
              }}
              onBuyConsumable={async (id, currency, quantity) => {
                const ok = await buyConsumable(id, currency, quantity);
                if (ok) {
                  setPurchaseSuccess(id);
                  setTimeout(() => setPurchaseSuccess(null), 4000);
                }
                return ok;
              }}
            />
          )}
          {tab === 'rewards' && (
            <RewardsPanel
              address={walletState.address ?? undefined}
              localLedger={gridLedger}
            />
          )}
          {tab === 'milestones' && <MilestonesPanel gameId="diamond-veins" progress={milestoneProgress} />}
          {tab === 'comments' && (
            <CommentsSection articleId={gameCommentsArticleId('diamond-veins')} dappSectionHeader />
          )}
          </div>
        </UnifiedGameLayout>

        {lastRefineClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm dark:bg-black/70"
              onClick={clearLastRefineClaim}
              aria-hidden
            />
            <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">Refinement claimed</h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                You earned{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {lastRefineClaim.points.toLocaleString()} redeem points
                </strong>{' '}
                from {lastRefineClaim.amount.toLocaleString()} in-game diamonds
                {lastRefineClaim.points === lastRefineClaim.amount
                  ? ' (1 diamond = 1 point).'
                  : '.'}
              </p>
              <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-500">
                Redeem on the{' '}
                <Link href="/rewards" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
                  Rewards & Points
                </Link>{' '}
                page.
              </p>
              <button
                type="button"
                onClick={clearLastRefineClaim}
                className="k-cta-games w-full rounded-xl py-3 font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </GameTooltipProvider>
  );
}
