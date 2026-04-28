'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useDiamondMining } from '@/hooks/useDiamondMining';
import type { MiningSlot, MiningSlotType } from '@/lib/game/engine';
import {
  ChroniclesNftSlotSelector,
  chroniclesNftRefToCollectionAndId,
} from '@/components/chronicles/leaderboard/ChroniclesNftSlotSelector';
import { useKasparexGlobalNftUsage } from '@/hooks/useKasparexGlobalNftUsage';
import { nftRefKey } from '@/lib/nft/kasparexMergedGlobalNftRefs';
import { getMinecoreDeckCollectionAllowlist } from '@/lib/nft/minecore-deck-collections';
import { GameTooltipProvider } from '@/components/game/diamond-veins/GameTooltip';
import { OverviewPanel } from '@/components/game/diamond-veins/panels/OverviewPanel';
import { MiningPanel } from '@/components/game/diamond-veins/panels/MiningPanel';
import { PowerPanel } from '@/components/game/diamond-veins/panels/PowerPanel';
import { WorkersPanel } from '@/components/game/diamond-veins/panels/WorkersPanel';
import { UpgradesPanel } from '@/components/game/diamond-veins/panels/UpgradesPanel';
import { RewardsPanel } from '@/components/game/diamond-veins/panels/RewardsPanel';
import type { BonusType } from '@/lib/game/diamond-bonuses';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import { GameOverviewSections } from '@/components/games/panels/GameOverviewSections';
import { IconComments, IconOverview, IconPower, IconRewards, IconShop, IconWorkers } from '@/components/games/icons/TabIcons';
import { UnifiedGameLayout } from '@/components/games/layout/UnifiedGameLayout';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <IconOverview /> },
  { id: 'mining', label: 'Mining', icon: <DiamondIcon className="h-4 w-4 text-sky-400" /> },
  { id: 'power', label: 'Power', icon: <IconPower /> },
  { id: 'workers', label: 'Workers', icon: <IconWorkers /> },
  { id: 'upgrades', label: 'Shop', icon: <IconShop /> },
  { id: 'rewards', label: 'Rewards', icon: <IconRewards /> },
  { id: 'comments', label: 'Comments', icon: <IconComments /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

function collectionAllowlistForTyconDeckSlot(_slot: MiningSlot | null | undefined): string[] | undefined {
  return getMinecoreDeckCollectionAllowlist();
}

function tyconDeckModalCopy(type: MiningSlotType): { title: string; description: string } {
  switch (type) {
    case 'worker':
      return {
        title: 'Worker slot',
        description:
          'Deploy a Premium or Partner NFT on this Worker row (when used with Minecore, it stacks flat diamonds per day on your rolling plant cap).',
      };
    case 'operator':
      return {
        title: 'Operator slot',
        description: 'Deploy a Premium or Partner NFT on the Operator row - higher mining throughput multipliers by tier.',
      };
    case 'foreman':
      return {
        title: 'Foreman slot',
        description: 'Deploy a Premium or Partner NFT for foreman perks including auto-restart when enabled.',
      };
    default:
      return { title: 'NFT slot', description: 'Choose an NFT allowed for this role.' };
  }
}

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

export function MiningDashboard({ featuredImage = '', loreStory = '', gameDescription = '', game, gameName }: MiningDashboardProps) {
  const { state: walletState } = useKaspaWallet();
  const {
    tycon,
    diamonds,
    slots,
    stats,
    activeBoosts,
    deployNFT,
    removeSlot,
    refineDiamonds,
    buyBoost,
    buyBoostWithKAS,
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
    lastRefineClaim,
    clearLastRefineClaim,
    kasBalanceLoading,
    miningRun,
    startMiningRun,
    miningRunOptions,
    miningAllowed,
    reconnectRequiredBy,
    machines,
    powerCapMw,
    automation,
    gridLedger,
    setAutoRestartMiningRun,
    buyExtraDrill,
    buyPowerUpgrade,
    redeemGrid,
  } = useDiamondMining();

  const { usageByRef, inUseRefs } = useKasparexGlobalNftUsage({
    payerKaspa: walletState.address ?? undefined,
    tyconSlots: slots,
  });

  const [tab, setTab] = useState<TabId>('overview');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);

  const kasValid = typeof kasBalance === 'number' && !Number.isNaN(kasBalance);
  const kasBalanceNum = kasValid ? kasBalance : 0;

  const garageItem = (item: { id: string; name: string; price: number; priceKAS: number; type: BonusType; mult: number }) => ({
    ...item,
  });

  const connections = (game?.connections ?? []) as any[];
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

  return (
    <GameTooltipProvider>
      <div className="flex flex-col space-y-6">
        {reconnectRequiredBy && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-medium text-amber-800 dark:text-amber-200">
            Mining is paused. Reconnect your wallet at least once per day to keep recording rewards. Connect with KasWare to resume.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-100 p-4 text-base dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex flex-wrap items-center gap-6">
            <span className="font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">KREX (L1)</span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {krexL1Balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} KREX
            </span>
            <span className="font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">KAS</span>
            <span className="min-w-[5rem] font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {canPayWithL1 && kasBalanceLoading ? '0' : kasBalanceNum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}{' '}
              KAS
            </span>
            <span className="inline-flex items-center gap-2 font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
              <DiamondIcon className="h-4 w-4 text-sky-400" />
              Reward Weight
            </span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{(Math.floor(diamonds) + Math.floor(refinementPointsTotal ?? 0)).toLocaleString()}</span>
            <span className="rounded-full border border-zinc-300 bg-zinc-200 px-2 py-0.5 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              {krexTier}
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Earn on L1 · claim GRID on L2 via <Link href="/rewards-and-points" className="font-semibold text-emerald-600 dark:text-emerald-400 underline">Rewards &amp; Points</Link>
          </p>
        </div>

        <UnifiedGameLayout
          tabs={TABS as any}
          currentTab={tab}
          onTabChange={setTab}
          resources={[
            {
              id: 'diamonds',
              label: 'Reward Weight',
              value: (Math.floor(diamonds) + Math.floor(refinementPointsTotal ?? 0)).toLocaleString(),
              subValue: `${Math.floor(diamonds).toLocaleString()} Diamonds + ${Math.floor(refinementPointsTotal ?? 0).toLocaleString()} Points`,
              description: 'Combined reward potential',
              tooltip: 'Your total reward weight: Diamonds in bag plus earned Refinement Points. Click to open Mining.',
              accent: 'diamonds',
              icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" />,
              onClick: () => setTab('mining'),
            },
            {
              id: 'kas',
              label: 'KAS',
              value: (canPayWithL1 && kasBalanceLoading ? 0 : kasBalanceNum).toLocaleString(undefined, { maximumFractionDigits: 4 }),
              description: 'Main fuel currency',
              tooltip: 'Your Kaspa L1 wallet balance (KasWare/Kastle). Used for Garage purchases. Click to open Shop.',
              accent: 'kas',
              onClick: () => setTab('upgrades'),
            },
            {
              id: 'krex',
              label: 'KREX',
              value: krexL1Balance.toLocaleString(undefined, { maximumFractionDigits: 2 }),
              description: 'Utility and power token',
              tooltip: `Your KREX balance on L1. Tier ${krexTier} gives KAS-only Garage discounts. Click to open Shop.`,
              accent: 'krex',
              onClick: () => setTab('upgrades'),
            },
          ]}
          game={{
            name: gameName ?? 'Diamond Veins',
            featuredImage: featuredImage,
            connections,
            categories,
            tags,
          }}
          onOpenOverview={openOverview}
          deckFooter={<span>Values update live as you mine, refine, and buy boosts.</span>}
        >
          {activeBoosts.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Active boosts</h3>
              <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                {activeBoosts.map((b) => {
                  const minLeft = Math.max(0, Math.ceil((b.endTime - Date.now()) / 60000));
                  return (
                    <li key={b.id} className="flex items-center justify-between">
                      <span>{b.name ?? b.type}</span>
                      <span>{minLeft > 0 ? `${minLeft} min left` : 'Expired'}</span>
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
              <OverviewPanel tycon={tycon} stats={stats} miningAllowed={miningAllowed} />
              <GameOverviewSections
                gameName={gameName ?? 'Diamond Veins'}
                description={gameDescription}
                loreStory={loreStory}
                featuredImage={featuredImage || undefined}
                flow={[
                  'Mine diamonds continuously (workers, power, boosts).',
                  'Refine when you reach the minimum threshold to mint refinement points.',
                  'Use checkpoints/points to claim GRID rewards later in Rewards & Points.',
                ]}
              />
            </div>
          )}
          {tab === 'mining' && (
            <MiningPanel
              tycon={tycon}
              stats={stats}
              diamonds={diamonds}
              refineMinDiamonds={refineMinDiamonds}
              refining={refining}
              onRefine={async () => {
                if (diamonds < refineMinDiamonds || refining) return;
                setRefining(true);
                try {
                  await refineDiamonds();
                } finally {
                  setRefining(false);
                }
              }}
              miningRun={miningRun}
              miningRunOptions={miningRunOptions}
              onStartMiningRun={startMiningRun}
            />
          )}
          {tab === 'power' && (
            <PowerPanel
              machines={machines}
              powerCapMw={powerCapMw}
              stats={stats}
              onBuyDrill={buyExtraDrill}
              onBuyPower={buyPowerUpgrade}
            />
          )}
          {tab === 'workers' && (
            <WorkersPanel
              slots={slots}
              slottedMetadata={slottedMetadata}
              automation={automation}
              onSlotClick={setSelectedSlotIndex}
              onToggleAutoRestart={setAutoRestartMiningRun}
              onClearSlot={removeSlot}
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
              onBuyKrex={async (item) => {
                const g = garageItem(item);
                try {
                  await buyBoost(g.id, g.name, g.price, g.type, g.mult);
                  setPurchaseSuccess(g.name);
                  setTimeout(() => setPurchaseSuccess(null), 5000);
                } catch {
                  /* toast elsewhere */
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
            />
          )}
          {tab === 'rewards' && (
            <RewardsPanel 
              address={walletState.address ?? undefined} 
              diamondsBalance={diamonds}
              refinementPointsTotal={refinementPointsTotal} 
              localLedger={gridLedger} 
              onRefine={refineDiamonds}
              onRedeem={redeemGrid}
            />
          )}
          {tab === 'comments' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Community comments</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Share mining setups, traits, and strategies. Wallet connection required to post.
                </p>
              </div>
              <CommentsSection articleId="game:diamond-veins" />
            </div>
          )}
        </UnifiedGameLayout>

        <div className="mt-8 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <button
              type="button"
              onClick={() => setFaqOpen((o) => !o)}
              className="flex w-full items-center justify-between p-4 text-left text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800/50"
            >
              FAQ & How rewards work
              <svg className={`h-5 w-5 transition-transform ${faqOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {faqOpen && (
              <div className="space-y-4 border-t border-zinc-200 px-4 pb-4 pt-2 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                <div>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-300">Tabs overview</p>
                  <p className="mt-1">
                    Use <strong>Mining</strong> for refine and runs, <strong>Power</strong> for MW and drills, <strong>Workers</strong> for NFT slots and auto-restart, <strong>Shop</strong> to buy items, and <strong>Rewards</strong> for GRID checkpoint history.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-300">GRID on Kasplex L2</p>
                  <p className="mt-1">
                    Refines append ledger rows used with <Link href="/rewards-and-points" className="font-semibold text-emerald-600 underline dark:text-emerald-400">Rewards & Points</Link>. On-chain distribution follows your ecosystem <code>RewardManager</code> / FeeRouter configuration.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {lastRefineClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm dark:bg-black/70" onClick={clearLastRefineClaim} aria-hidden />
            <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">Refinement claimed</h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                You earned{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">{lastRefineClaim.points.toLocaleString()} refinement points</strong> from{' '}
                {lastRefineClaim.amount.toLocaleString()} in-game diamonds.
              </p>
              <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-500">
                Claim GRID on L2 on the <Link href="/rewards-and-points" className="font-semibold text-emerald-600 underline dark:text-emerald-400">Rewards & Points</Link> page.
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

        {selectedSlotIndex !== null && (() => {
          const slot = slots[selectedSlotIndex] ?? null;
          const copy = slot ? tyconDeckModalCopy(slot.type) : null;
          const current =
            slot?.nftId != null && slot.collection ? nftRefKey(slot.collection, slot.nftId) : null;
          if (!slot || !copy) return null;
          return (
            <ChroniclesNftSlotSelector
              isOpen={true}
              title={copy.title}
              description={copy.description}
              currentValue={current}
              inUseRefs={inUseRefs}
              usageByRef={usageByRef}
              currentContext={{
                entityType: 'tycon',
                entityId: 'mining',
                slotIndex: selectedSlotIndex,
              }}
              collectionAllowlist={collectionAllowlistForTyconDeckSlot(slot)}
              footerNotice="Deployments save to Diamond Mining state in this browser. NFTs used in Minecore or Chronicles show as locked."
              onClose={() => setSelectedSlotIndex(null)}
              onSelect={(ref) => {
                const p = chroniclesNftRefToCollectionAndId(ref);
                if (!p) return;
                deployNFT(selectedSlotIndex, p.tokenId, p.collection);
                setSelectedSlotIndex(null);
              }}
              onRemove={() => {
                removeSlot(selectedSlotIndex);
                setSelectedSlotIndex(null);
              }}
            />
          );
        })()}
      </div>
    </GameTooltipProvider>
  );
}
