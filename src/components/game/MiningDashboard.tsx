'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useDiamondMining } from '@/hooks/useDiamondMining';
import { NFTSlotSelector } from './NFTSlotSelector';
import { GameTooltipProvider } from '@/components/game/diamond-veins/GameTooltip';
import { OverviewPanel } from '@/components/game/diamond-veins/panels/OverviewPanel';
import { MiningPanel } from '@/components/game/diamond-veins/panels/MiningPanel';
import { PowerPanel } from '@/components/game/diamond-veins/panels/PowerPanel';
import { WorkersPanel } from '@/components/game/diamond-veins/panels/WorkersPanel';
import { UpgradesPanel } from '@/components/game/diamond-veins/panels/UpgradesPanel';
import { RewardsPanel } from '@/components/game/diamond-veins/panels/RewardsPanel';
import type { BonusType } from '@/lib/game/diamond-bonuses';
import { GameDeckPanel } from '@/components/games/panels/GameDeckPanel';
import { useWalletDeck } from '@/hooks/useWalletDeck';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import { GameMetadataPanel } from '@/components/games/panels/GameMetadataPanel';
import { GameInteractionsPanel } from '@/components/games/panels/GameInteractionsPanel';
import { GamePurchasesPanel } from '@/components/games/panels/GamePurchasesPanel';
import { GameFeaturedPanel } from '@/components/games/panels/GameFeaturedPanel';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'mining', label: 'Mining' },
  { id: 'power', label: 'Power' },
  { id: 'workers', label: 'Workers' },
  { id: 'upgrades', label: 'Shop' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'comments', label: 'Comments' },
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
    getPriceAfterDiscount,
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
  } = useDiamondMining();

  const { data: deck } = useWalletDeck();

  const [tab, setTab] = useState<TabId>('overview');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [loreExpanded, setLoreExpanded] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);

  const [, setBoostTick] = useState(0);
  useEffect(() => {
    if (activeBoosts.length === 0 && !miningRun) return;
    const t = setInterval(() => setBoostTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, [activeBoosts.length, miningRun]);

  const kasValid = typeof kasBalance === 'number' && !Number.isNaN(kasBalance);
  const kasBalanceNum = kasValid ? kasBalance : 0;

  const garageItem = (item: { id: string; name: string; price: number; priceKAS: number; type: BonusType; mult: number }) => ({
    ...item,
  });

  const connections = (game?.connections ?? []) as Array<{ toSlug?: string; toHref?: string; title: string; punch: string; requirement?: string }>;
  const categories = (game?.categories ?? []) as string[];
  const tags = (game?.tags ?? []) as string[];
  const pendingGrid = deck?.rewards?.pendingGrid ?? 0;

  return (
    <GameTooltipProvider>
      <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col space-y-6 lg:col-span-8">
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
                Diamonds
              </span>
              <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{Math.floor(diamonds).toLocaleString()}</span>
              <span className="rounded-full border border-zinc-300 bg-zinc-200 px-2 py-0.5 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                {krexTier}
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Earn on L1 · claim GRID on L2 via <Link href="/rewards-and-points" className="font-semibold text-emerald-600 underline dark:text-emerald-400">Rewards &amp; Points</Link>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === t.id
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {t.id === 'overview' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4 6h16M4 12h10M4 18h16" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : null}
                  {t.id === 'mining' ? <DiamondIcon className="h-4 w-4 text-sky-400" /> : null}
                  {t.id === 'power' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                  {t.id === 'workers' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11z" strokeWidth="2" />
                      <path d="M8 11c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11z" strokeWidth="2" />
                      <path d="M2 20c0-3 3-5 6-5" strokeWidth="2" strokeLinecap="round" />
                      <path d="M22 20c0-3-3-5-6-5" strokeWidth="2" strokeLinecap="round" />
                      <path d="M8 15h8" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : null}
                  {t.id === 'upgrades' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M7 7h14l-1 8H8L7 7z" strokeWidth="2" strokeLinejoin="round" />
                      <path d="M7 7L6 3H2" strokeWidth="2" strokeLinecap="round" />
                      <path d="M9 21a1 1 0 100-2 1 1 0 000 2zM19 21a1 1 0 100-2 1 1 0 000 2z" strokeWidth="2" />
                    </svg>
                  ) : null}
                  {t.id === 'rewards' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7l3-7z" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                  {t.id === 'comments' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                  <span>{t.label}</span>
                </span>
              </button>
            ))}
          </div>

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
            <OverviewPanel tycon={tycon} stats={stats} miningAllowed={miningAllowed} />
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
            />
          )}
          {tab === 'upgrades' && (
            <UpgradesPanel
              canPayWithL1={canPayWithL1}
              krexL1Balance={krexL1Balance}
              kasBalance={kasBalance}
              kasBalanceLoading={kasBalanceLoading}
              krexTier={krexTier}
              getPriceAfterDiscount={getPriceAfterDiscount}
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
            <RewardsPanel address={walletState.address ?? undefined} refinementPointsTotal={refinementPointsTotal} localLedger={gridLedger} />
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
        </div>

        <div className="flex flex-col space-y-6 lg:col-span-4">
          <GameDeckPanel
            resources={[
              {
                id: 'diamonds',
                label: 'Diamonds',
                value: Math.floor(diamonds).toLocaleString(),
                hint: 'Click to open Mining',
                accent: 'diamonds',
                icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" />,
                onClick: () => setTab('mining'),
              },
              {
                id: 'grid',
                label: 'GRID (pending)',
                value: pendingGrid.toLocaleString(),
                hint: 'Unified deck rewards',
                accent: 'grid',
                onClick: () => setTab('rewards'),
              },
              {
                id: 'kas',
                label: 'KAS',
                value: (canPayWithL1 && kasBalanceLoading ? 0 : kasBalanceNum).toLocaleString(undefined, { maximumFractionDigits: 4 }),
                hint: 'L1 balance (KasWare/Kastle)',
                accent: 'kas',
                onClick: () => setTab('upgrades'),
              },
              {
                id: 'krex',
                label: 'KREX',
                value: krexL1Balance.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                hint: `Tier ${krexTier} discounts`,
                accent: 'krex',
                onClick: () => setTab('upgrades'),
              },
            ]}
            footer={
              <span>
                Values update live as you mine, refine, and buy boosts.
              </span>
            }
          />

          <GameMetadataPanel categories={categories} tags={tags} />
          <GameInteractionsPanel interactions={connections} />
          <GamePurchasesPanel>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {activeBoosts.length > 0 ? (
                <div className="space-y-2">
                  {activeBoosts.map((b) => (
                    <div key={b.id} className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{b.name ?? b.type}</div>
                      <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                        Ends {new Date(b.endTime).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs">No active purchases yet. Open the Shop tab to buy a boost.</p>
              )}
            </div>
          </GamePurchasesPanel>
          <GameFeaturedPanel featuredImage={featuredImage} title={gameName ?? 'Diamond Veins'} description={gameDescription} loreStory={loreStory} />

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <button
              type="button"
              onClick={() => setFaqOpen((o) => !o)}
              className="flex w-full items-center justify-between p-4 text-left text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800/50"
            >
              FAQ &amp; How rewards work
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
                    Refines append ledger rows used with <Link href="/rewards-and-points" className="font-semibold text-emerald-600 underline dark:text-emerald-400">Rewards &amp; Points</Link>. On-chain distribution follows your ecosystem <code className="text-xs">RewardManager</code> / FeeRouter configuration.
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
                Claim GRID on L2 on the <Link href="/rewards-and-points" className="font-semibold text-emerald-600 underline dark:text-emerald-400">Rewards &amp; Points</Link> page.
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

        {selectedSlotIndex !== null && (
          <NFTSlotSelector
            slotIndex={selectedSlotIndex}
            slot={slots[selectedSlotIndex] ?? null}
            allSlots={slots}
            isOpen={true}
            onClose={() => setSelectedSlotIndex(null)}
            onDeploy={deployNFT}
            onRemove={() => {
              removeSlot(selectedSlotIndex);
              setSelectedSlotIndex(null);
            }}
          />
        )}
      </div>
    </GameTooltipProvider>
  );
}
