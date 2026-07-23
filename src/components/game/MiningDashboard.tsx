'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useDiamondMining } from '@/hooks/useDiamondMining';
import { GameTooltipProvider } from '@/components/game/diamond-veins/GameTooltip';
import { OverviewPanel } from '@/components/game/diamond-veins/panels/OverviewPanel';
import { MiningPanel } from '@/components/game/diamond-veins/panels/MiningPanel';
import { UpgradesPanel } from '@/components/game/diamond-veins/panels/UpgradesPanel';
import { RewardsPanel } from '@/components/game/diamond-veins/panels/RewardsPanel';
import type { BonusType } from '@/lib/game/diamond-bonuses';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import { GameOverviewSections } from '@/components/games/panels/GameOverviewSections';
import {
  IconComments,
  IconMilestones,
  IconOverview,
  IconRewards,
  IconShop,
} from '@/components/games/icons/TabIcons';
import { UnifiedGameLayout } from '@/components/games/layout/UnifiedGameLayout';
import { useGameCommentsTabs, gameCommentsArticleId } from '@/components/games/comments/gameComments';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { MilestonesPanel } from '@/components/games/modules/MilestonesPanel';
import { useGameMilestones } from '@/hooks/useGameMilestones';
import { KREX_TIER_SHOP_DISCOUNT_PCT, KREX_TIER_YIELD_BONUS_PCT } from '@/lib/game/diamond-veins-config';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <IconOverview /> },
  { id: 'mining', label: 'Mining', icon: <DiamondIcon className="h-4 w-4 text-sky-400" /> },
  { id: 'upgrades', label: 'Shop', icon: <IconShop /> },
  { id: 'rewards', label: 'Rewards', icon: <IconRewards /> },
  { id: 'milestones', label: 'Milestones', icon: <IconMilestones /> },
  { id: 'comments', label: 'Comments', icon: <IconComments /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

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
  const redeemBreakdown = useRedeemablePointsBreakdown();
  const redeemUnifiedMatches = useMemo(() => {
    const w = walletState.address?.trim();
    if (!w || !redeemBreakdown.address) return false;
    try {
      return normalizeKaspaAddress(w) === redeemBreakdown.address;
    } catch {
      const nw = w.startsWith('kaspa:') ? w : `kaspa:${w}`;
      return nw.toLowerCase() === redeemBreakdown.address.toLowerCase();
    }
  }, [walletState.address, redeemBreakdown.address]);

  const {
    tycon,
    diamonds,
    slots,
    stats,
    activeBoosts,
    deployNFT,
    removeSlot,
    purchaseNftDeckSlot,
    slotPurchaseKas,
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
  const [refineAmount, setRefineAmount] = useState(() => Math.max(0, Math.floor(diamonds)));

  useEffect(() => {
    setRefineAmount(Math.max(0, Math.floor(diamonds)));
  }, [diamonds]);

  const runRefine = async (amount: number) => {
    if (amount < refineMinDiamonds || refining) return;
    setRefining(true);
    try {
      await refineDiamonds(amount);
    } finally {
      setRefining(false);
    }
  };

  const garageItem = (item: {
    id: string;
    name: string;
    price: number;
    priceKAS: number;
    type: BonusType;
    mult: number;
  }) => ({ ...item });

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

  const tabsWithComments = useGameCommentsTabs(TABS, 'diamond-veins');

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

  const krexYieldBonus = KREX_TIER_YIELD_BONUS_PCT[krexTier] ?? 0;
  const krexShopDiscount = KREX_TIER_SHOP_DISCOUNT_PCT[krexTier] ?? 0;

  const deckResources = useMemo(
    () => [
      {
        id: 'diamonds',
        label: 'Diamonds',
        value: (
          <span className="text-lg font-black tabular-nums tracking-tight text-amber-500 sm:text-xl">
            {diamonds < 100 ? diamonds.toFixed(2) : Math.floor(diamonds).toLocaleString()}
          </span>
        ),
        subValue: (
          <>
            <span className="font-semibold tabular-nums">{stats.yieldPerSecond.toFixed(2)}</span>
            <span className="font-bold text-zinc-500 dark:text-zinc-400"> D/s</span>
            <span className="font-bold text-zinc-500 dark:text-zinc-400">
              {' '}
              · KREX {krexTier}
              {krexYieldBonus > 0 ? ` +${krexYieldBonus}%` : ''}
              {krexShopDiscount > 0 ? ` · ${krexShopDiscount}% shop` : ''}
            </span>
          </>
        ),
        description: 'Mined in-game · refine into Hub points',
        tooltip:
          'Diamonds mined by NFT workers. Refine below to add Hub redeem points on /rewards. Subtext is live D/s and your KREX tier.',
        accent: 'diamonds' as const,
        icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" />,
        onClick: () => setTab('mining'),
      },
      {
        id: 'refine',
        label: 'Refine to Hub',
        description: `Min ${refineMinDiamonds} Diamonds → Hub redeem points`,
        tooltip:
          'Converts bag Diamonds into Hub redeem points counted on /rewards. No separate in-game redeem balance to manage.',
        value: (
          <div
            className="flex flex-wrap items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <input
              type="number"
              min={refineMinDiamonds}
              max={Math.max(refineMinDiamonds, Math.floor(diamonds))}
              value={refineAmount}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isFinite(n)) return;
                setRefineAmount(Math.max(0, Math.floor(n)));
              }}
              className="h-8 w-16 rounded-md border border-zinc-200 bg-white px-1.5 text-right text-xs font-semibold tabular-nums dark:border-zinc-600 dark:bg-zinc-950"
              aria-label="Refine amount"
            />
            <button
              type="button"
              className="h-8 rounded-md border border-zinc-200 px-2 text-[10px] font-bold uppercase tracking-wide text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={() => setRefineAmount(Math.floor(diamonds))}
            >
              Max
            </button>
            <button
              type="button"
              disabled={refineAmount < refineMinDiamonds || refining || diamonds < refineMinDiamonds}
              onClick={() => void runRefine(refineAmount)}
              className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refining ? '…' : 'Refine'}
            </button>
          </div>
        ),
      },
    ],
    [
      diamonds,
      stats.yieldPerSecond,
      krexTier,
      krexYieldBonus,
      krexShopDiscount,
      refineMinDiamonds,
      refineAmount,
      refining,
    ],
  );

  return (
    <GameTooltipProvider>
      <div className="flex flex-col space-y-6">
        {reconnectRequiredBy && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-medium text-amber-800 dark:text-amber-200">
            Mining is paused. Connect your wallet to resume. Your Diamonds, slots, and Hub points stay saved to that
            wallet.
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
          {activeBoosts.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Active boosts</h3>
              <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                {activeBoosts.map((b) => {
                  const minLeft = Math.max(0, Math.ceil((b.endTime - Date.now()) / 60000));
                  return (
                    <li key={b.id} className="flex items-center justify-between gap-3">
                      <span>{b.name ?? b.type}</span>
                      <span className="shrink-0 tabular-nums">{minLeft} min left</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {purchaseSuccess && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/20 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              Purchase complete. &quot;{purchaseSuccess}&quot; is now active.
            </div>
          )}

          {tab === 'overview' && (
            <div className="space-y-6">
              <OverviewPanel
                tycon={tycon}
                stats={stats}
                miningAllowed={miningAllowed}
                krexTier={krexTier}
                krexYieldBonusPct={krexYieldBonus}
                krexShopDiscountPct={krexShopDiscount}
              />
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
              slotPurchaseKas={slotPurchaseKas}
              miningAllowed={miningAllowed}
              consumables={consumables}
              onFeedWorker={feedWorker}
              krexTier={krexTier}
              krexYieldBonusPct={krexYieldBonus}
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
              onBuyKrex={async (item) => {
                const g = garageItem(item);
                try {
                  await buyBoost(g.id, g.name, g.price, g.type, g.mult);
                  setPurchaseSuccess(g.name);
                  setTimeout(() => setPurchaseSuccess(null), 5000);
                } catch {
                  /* */
                }
              }}
              onBuyKas={async (item) => {
                const g = garageItem(item);
                try {
                  await buyBoostWithKAS(g.id, g.name, g.priceKAS, g.type, g.mult);
                  setPurchaseSuccess(g.name);
                  setTimeout(() => setPurchaseSuccess(null), 5000);
                } catch {
                  /* */
                }
              }}
              onBuyConsumable={async (id, currency) => {
                const ok = await buyConsumable(id, currency);
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
              diamondsBalance={diamonds}
              refinementPointsTotal={refinementPointsTotal}
              unifiedRedeemablePoints={redeemUnifiedMatches ? redeemBreakdown.totalRedeemable : undefined}
              hubLedgerNetPoints={redeemUnifiedMatches ? redeemBreakdown.ledgerNetRedeemable : undefined}
              localLedger={gridLedger}
              onRefine={(amount) => {
                void runRefine(amount);
              }}
            />
          )}
          {tab === 'milestones' && <MilestonesPanel gameId="diamond-veins" progress={milestoneProgress} />}
          {tab === 'comments' && (
            <CommentsSection articleId={gameCommentsArticleId('diamond-veins')} dappSectionHeader />
          )}
          </div>
        </UnifiedGameLayout>

        <div className="mt-8 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <button
              type="button"
              onClick={() => setFaqOpen((o) => !o)}
              className="flex w-full items-center justify-between p-4 text-left text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800/50"
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
            {faqOpen && (
              <div className="space-y-4 border-t border-zinc-200 px-4 pb-4 pt-2 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                <div>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-300">Tabs overview</p>
                  <p className="mt-1">
                    <strong>Mining</strong> holds NFT worker slots and refine. <strong>Shop</strong> sells food, drinks,
                    repair kits, and boosts. <strong>Rewards</strong> redeem Diamonds into Hub points.{' '}
                    <strong>Milestones</strong> track long-term goals.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-300">Hub Points</p>
                  <p className="mt-1">
                    Refining Diamonds mints redeem points that count toward{' '}
                    <Link href="/rewards" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
                      Rewards & Points
                    </Link>
                    , same bridge as Minecore.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

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
                from {lastRefineClaim.amount.toLocaleString()} in-game diamonds.
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
                className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white transition-colors hover:bg-emerald-600"
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
