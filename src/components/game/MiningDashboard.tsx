'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDiamondMining } from '@/hooks/useDiamondMining';
import { NFTSlotSelector } from './NFTSlotSelector';
import { getBonusForTrait, getNFTTier } from '@/lib/game/diamond-bonuses';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { WORKER_TIER_MULTIPLIERS, OPERATOR_TIER_MULTIPLIERS } from '@/lib/game/diamond-veins-config';

const GARAGE_ITEMS = [
  { id: 'nitrogen-overclock', name: "Vector's Overclock", price: 100, priceKAS: 0.5, desc: '+25% Yield (1h)', icon: '⚡', type: 'yield' as const, mult: 0.25 },
  { id: 'crystal-resonance', name: 'Crystal Resonance', price: 500, priceKAS: 2, desc: '+50% Rare Drops', icon: '📡', type: 'luck' as const, mult: 0.5 },
  { id: 'ai-auto-refiner', name: 'ARIA Auto-Refiner', price: 2500, priceKAS: 10, desc: 'Auto-claim every 4h', icon: '🤖', type: 'efficiency' as const, mult: 0.1 },
];

interface MiningDashboardProps {
  featuredImage?: string;
  loreStory?: string;
  gameDescription?: string;
}

export function MiningDashboard({ featuredImage = '', loreStory = '', gameDescription = '' }: MiningDashboardProps) {
  const {
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
  } = useDiamondMining();
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [loreExpanded, setLoreExpanded] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);

  // Refresh "min left" for active boosts and mining run every 60s
  const [, setBoostTick] = useState(0);
  useEffect(() => {
    if (activeBoosts.length === 0 && !miningRun) return;
    const t = setInterval(() => setBoostTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, [activeBoosts.length, miningRun]);

  const kasValid = typeof kasBalance === 'number' && !Number.isNaN(kasBalance);
  const kasBalanceNum = kasValid ? kasBalance : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Left Column: Mining Area */}
      <div className="lg:col-span-8 flex flex-col space-y-8">
        {/* 24h reconnect notice */}
        {reconnectRequiredBy && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-sm font-medium">
            Mining is paused. Reconnect your wallet (Workers, Operators, and boosters) at least once per day to keep recording rewards. Connect with KasWare to resume.
          </div>
        )}

        {/* KREX + KAS + Refinement points + tier */}
        <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-base flex-wrap gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-zinc-500 dark:text-zinc-400 font-semibold tracking-wide">KREX (L1)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
              {krexL1Balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} KREX
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 font-semibold tracking-wide">KAS</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold tabular-nums min-w-[5rem]">
              {(canPayWithL1 && kasBalanceLoading) ? '0' : kasBalanceNum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} KAS
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 font-semibold tracking-wide">Refinement points</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
              {refinementPointsTotal.toLocaleString()}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-semibold border border-zinc-300 dark:border-zinc-700">
              {krexTier}
            </span>
          </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Earn <strong>points on L1</strong> when you refine; claim <strong>rewards on L2</strong> via Rewards &amp; Points. Pay with KREX or KAS in Garage.</p>
        </div>

        {/* Diamond Counter & Refine */}
        <div className="p-8 rounded-3xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -mr-32 -mt-32" />

          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-emerald-600 dark:text-emerald-500 font-semibold text-sm uppercase tracking-wide">System Status: Mining Active</span>
              <div className="flex items-baseline gap-3">
                <h2 className="text-5xl lg:text-6xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{Math.floor(diamonds).toLocaleString()}</h2>
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">DIAMONDS</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-base">
                Refine when you have at least <span className="text-zinc-800 dark:text-zinc-300 font-semibold">{refineMinDiamonds} in-game diamonds</span> (mined by your Workers and Operators). You receive <strong>refinement points</strong> (your rewards); your total is shown at the top. Wait 30+ min after last refine for 1.5× time bonus.
              </p>
            </div>

            <button
              onClick={async () => {
                if (diamonds < refineMinDiamonds || refining) return;
                setRefining(true);
                try {
                  await refineDiamonds();
                } finally {
                  setRefining(false);
                }
              }}
              disabled={diamonds < refineMinDiamonds || refining}
              className="k-cta-primary h-16 px-8 text-lg group relative active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
            >
              {refining ? '…' : 'REFINE NOW'}
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* NFT Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {slots.map((slot, idx) => {
            const meta = slot.nftId !== null ? slottedMetadata[slot.nftId] : null;
            const tier = slot.nftId !== null && slot.collection ? getNFTTier(slot.collection, slot.nftId, meta) : null;
            const tierKey = (tier ?? 'regular') as keyof typeof WORKER_TIER_MULTIPLIERS;
            const workerMult = slot.type === 'worker' ? (WORKER_TIER_MULTIPLIERS[tierKey] ?? 1) : null;
            const operatorMult = slot.type === 'operator' ? (OPERATOR_TIER_MULTIPLIERS[tierKey] ?? 2) : null;
            const traitBonus = meta?.traits?.reduce((sum, t) => sum + (getBonusForTrait(String(t.value))?.value ?? 0), 0) ?? 0;
            const yieldMult = workerMult != null ? (workerMult * (1 + traitBonus)).toFixed(2) : null;
            const speedMult = operatorMult != null ? (operatorMult * (1 + traitBonus)).toFixed(2) : null;
            const slotImageUrl = meta?.image ? getBestGatewayUrl(String(meta.image).replace('ipfs://', '')) : null;
            return (
              <div
                key={idx}
                onClick={() => setSelectedSlotIndex(idx)}
                className="aspect-square relative flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900/40 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500/50 transition-all group overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                {!slot.nftId ? (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide text-base">{(slot.type as string).charAt(0).toUpperCase() + (slot.type as string).slice(1)}</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Deploy {slot.collection || 'Any NFT'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center w-full flex flex-col items-center">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 ring-2 ring-emerald-500/30 flex-shrink-0">
                      {slotImageUrl ? (
                        <img src={slotImageUrl} alt={`#${slot.nftId}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">💎</div>
                      )}
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-2">#{slot.nftId}</h3>
                    {tier && tier !== 'regular' && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase">
                        {tier}
                      </span>
                    )}
                    {yieldMult != null && (
                      <p className="mt-1 text-emerald-600 dark:text-emerald-500 text-xs font-semibold">Yield {yieldMult}×</p>
                    )}
                    {speedMult != null && (
                      <p className="mt-1 text-emerald-600 dark:text-emerald-500 text-xs font-semibold">Speed {speedMult}×</p>
                    )}
                    <div className="mt-1 flex flex-wrap justify-center gap-1">
                      {meta?.traits?.map((trait, i) => {
                        const bonus = getBonusForTrait(String(trait.value));
                        if (!bonus) return null;
                        return (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase">
                            {bonus.type} +{(bonus.value * 100).toFixed(0)}%
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-500 text-[10px] font-semibold uppercase mt-1">LOCKED · ACTIVE</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Click to manage</p>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500/50 blur-[2px] translate-y-full group-hover:translate-y-0 transition-transform" />
              </div>
            );
          })}
        </div>

        {/* Production Summary - theme aware */}
        <div className="p-6 rounded-3xl bg-zinc-100 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-sm flex-wrap gap-4">
          <div className="flex gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Flow Rate</span>
              <span className="text-emerald-600 dark:text-emerald-500 font-bold">{stats.yieldPerSecond.toFixed(2)} D/s</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Efficiency</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-bold">{(stats.totalMultiplier * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="text-zinc-500 dark:text-zinc-400 font-medium">Powered by Kasparex · Secured by Kaspa BlockDAG</div>
        </div>

        {/* Mining run lock options */}
        <div className="p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Mining run</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Lock a run for a set period to get a yield multiplier. Only one run at a time.</p>
          {miningRun ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                Active: {miningRun.option?.label ?? 'Run'} · {miningRun.multiplier}x yield
              </span>
              <span className="text-zinc-600 dark:text-zinc-400 tabular-nums">
                {Math.ceil((miningRun.endTime - Date.now()) / 60000)} min left
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {miningRunOptions.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => startMiningRun(i)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
                >
                  {opt.label} ({opt.mult}x)
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">When the run ends, the multiplier stops; start a new run to boost again.</p>
        </div>

        {/* Active boosts */}
        {activeBoosts.length > 0 && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Active boosts</h3>
            <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              {activeBoosts.map((b) => {
                const minLeft = Math.max(0, Math.ceil((b.endTime - Date.now()) / 60000));
                return (
                  <li key={b.id} className="flex items-center justify-between">
                    <span>{b.name ?? (b.type === 'yield' ? '+' + (b.multiplier * 100).toFixed(0) + '% yield' : b.type === 'speed' ? '+' + (b.multiplier * 100).toFixed(0) + '% speed' : 'Boost')}</span>
                    <span>{minLeft > 0 ? `${minLeft} min left` : 'Expired'}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Purchase success message */}
        {purchaseSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-sm font-semibold">
            Purchase complete. &quot;{purchaseSuccess}&quot; is now active. Your mining rate is boosted.
          </div>
        )}

        {/* Garage Shop - main content under slots */}
        <div className="p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Garage Shop</h2>
            <span className="px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">LVL 01</span>
          </div>

          {!canPayWithL1 && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-sm">
              Connect with the <strong>KasWare</strong> extension to pay with KREX or KAS. Other wallets can play but cannot use the shop until you connect KasWare.
            </div>
          )}

          <div className="space-y-4">
            {GARAGE_ITEMS.map((item) => {
              const priceAfterDiscount = getPriceAfterDiscount(item.price);
              const canAffordKREX = canPayWithL1 && krexL1Balance >= priceAfterDiscount;
              const canAffordKAS = canPayWithL1 && !kasBalanceLoading && kasBalanceNum >= item.priceKAS * 0.999;
              const hasDiscount = priceAfterDiscount < item.price;
              const isBuying = buyingItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xl">{item.icon}</div>
                      <div>
                        <h4 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">{item.name}</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Pay:</span>
                    {hasDiscount && (
                      <span className="text-zinc-400 dark:text-zinc-500 line-through">{item.price} KREX</span>
                    )}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-500">{priceAfterDiscount} KREX</span>
                    <span className="text-zinc-400 dark:text-zinc-500">or</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{item.priceKAS} KAS</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      disabled={!canPayWithL1 || !canAffordKREX || isBuying}
                      onClick={() => {
                        buyBoost(item.id, item.name, item.price, item.type, item.mult).then(() => {
                          setPurchaseSuccess(item.name);
                          setTimeout(() => setPurchaseSuccess(null), 5000);
                        }).catch(() => {});
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isBuying ? '…' : 'Pay KREX'}
                    </button>
                    <button
                      type="button"
                      disabled={!canPayWithL1 || kasBalanceLoading || !canAffordKAS || isBuying}
                      onClick={() => {
                        buyBoostWithKAS(item.id, item.name, item.priceKAS, item.type, item.mult).then(() => {
                          setPurchaseSuccess(item.name);
                          setTimeout(() => setPurchaseSuccess(null), 5000);
                        }).catch(() => {});
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isBuying ? '…' : 'Pay KAS'}
                    </button>
                  </div>
                  {!canPayWithL1 && <span className="block mt-1 text-xs text-zinc-500 dark:text-zinc-500">Connect KasWare wallet</span>}
                  {canPayWithL1 && !canAffordKREX && !canAffordKAS && !kasBalanceLoading && <span className="block mt-1 text-xs text-amber-600 dark:text-amber-500">Insufficient KREX & KAS</span>}
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-xs text-center text-emerald-700 dark:text-emerald-400 font-semibold">
              {revenuePoolPct}% of Garage revenue goes to the Diamond Veins rewards pool
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Featured image, lore, FAQ */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        {/* Featured image + lore */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-100 dark:bg-zinc-900/50">
          {featuredImage && (
            <div className="aspect-video w-full bg-zinc-200 dark:bg-zinc-800 relative">
              <img src={featuredImage} alt="Diamond Veins of Kaspaland" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-5">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">The Diamond Veins of Kaspaland</h2>
            {gameDescription && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed pl-3 border-l-2 border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10 py-2 pr-2 rounded-r">{gameDescription}</p>
            )}
            {loreStory && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {loreExpanded ? (
                  <div className="space-y-2">
                    {loreStory.split(/\n\n+/).map((block, i) => {
                      const line = block.trim();
                      const isSubtitle = line.length <= 60 && line === line.toUpperCase() && /^[A-Z0-9\s]+$/.test(line);
                      return isSubtitle ? (
                        <h4 key={i} className="text-emerald-600 dark:text-emerald-400 font-bold text-base uppercase tracking-wider pt-4 first:pt-0 border-b border-emerald-500/20 pb-1">
                          {line}
                        </h4>
                      ) : (
                        <p key={i}>{line}</p>
                      );
                    })}
                  </div>
                ) : (
                  <p>{loreStory.slice(0, 320)}…</p>
                )}
                <button
                  type="button"
                  onClick={() => setLoreExpanded((e) => !e)}
                  className="mt-2 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  {loreExpanded ? 'Show less' : 'Read full story'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FAQ / Help */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setFaqOpen((o) => !o)}
            className="w-full p-4 flex items-center justify-between text-left text-base font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
          >
            FAQ &amp; How rewards work
            <svg className={`w-5 h-5 transition-transform ${faqOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {faqOpen && (
            <div className="px-4 pb-4 space-y-4 text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-2">
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-300">What are Worker and Operator slots?</p>
                <p className="mt-1">Deploy a <strong>KREXPRIME</strong> NFT as a <strong>Worker</strong> to set your base diamond mining rate. Deploy a <strong>PIXELKREX</strong> NFT as an <strong>Operator</strong> to multiply that rate. Click an empty slot, then click an NFT in the modal to deploy it (no chain transaction required for deployment).</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-300">What is the Booster slot?</p>
                <p className="mt-1">The Booster slot is reserved for future partner collections. For now you can leave it empty; diamond yield comes from Worker and Operator.</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-300">What is the ratio for rewards and points?</p>
                <p className="mt-1">You earn <strong>1 point per in-game diamond</strong> when you refine (L1). If you wait at least 30 minutes after your last refine, you get a <strong>1.5× time bonus</strong> (up to 1.5 points per diamond). Your total points are shown at the top.</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-300">Earn on L1, claim on L2?</p>
                <p className="mt-1">Yes. You <strong>earn points on L1</strong> by mining and refining in Diamond Veins. Those points are recorded and then you <strong>claim rewards on L2</strong> (Igra/Kasplex L2) via the <Link href="/rewards-and-points" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Rewards &amp; Points</Link> page. Mine and refine here; spend and claim there.</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-300">How do I get and receive rewards?</p>
                <p className="mt-1">Mine <strong>in-game diamonds</strong> (the counter from your Worker and Operator). When you have at least {refineMinDiamonds}, click <strong>Refine Now</strong> to earn <strong>refinement points (L1)</strong>. Then go to Rewards &amp; Points to claim rewards on L2.</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-300">Where and how do I spend points? What can I claim?</p>
                <p className="mt-1">Points earned here are part of the <strong>Kasparex Points</strong> system. On the <Link href="/rewards-and-points" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Rewards &amp; Points</Link> page you can claim rewards on L2 (ecosystem pool, perks, and more).</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-300">Why are Pay KAS buttons disabled?</p>
                <p className="mt-1">Paying with KAS requires the <strong>KasWare</strong> browser extension to be installed and connected. If you use another wallet, connect with KasWare on this page to enable KAS (and KREX) payments. Make sure you have enough KAS for the item price and network fees.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Refine claim result modal */}
      {lastRefineClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm" onClick={clearLastRefineClaim} aria-hidden />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Refinement claimed</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              You earned <strong className="text-emerald-600 dark:text-emerald-400">{lastRefineClaim.points.toLocaleString()} refinement points</strong> from {lastRefineClaim.amount.toLocaleString()} in-game diamonds.
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">
              You earned these points on L1. Claim rewards on L2 on the <Link href="/rewards-and-points" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Rewards &amp; Points</Link> page.
            </p>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
              Total refinement points this session: {refinementPointsTotal.toLocaleString()}
            </p>
            <button
              type="button"
              onClick={clearLastRefineClaim}
              className="w-full py-3 rounded-xl font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
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
  );
}
