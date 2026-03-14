'use client';

import { useState, useEffect } from 'react';
import { useDiamondMining } from '@/hooks/useDiamondMining';
import { useKasWare } from '@/hooks/useKasWare';
import { NFTSlotSelector } from './NFTSlotSelector';
import { getBonusForTrait, getNFTTier } from '@/lib/game/diamond-bonuses';

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
  } = useDiamondMining();
  const { balance: kasBalanceStr, refreshBalance: refreshKasBalance } = useKasWare();
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [loreExpanded, setLoreExpanded] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  // Refresh KAS balance when wallet is connected (KasWare) so Pay KAS buttons get correct state
  useEffect(() => {
    if (canPayWithL1 && refreshKasBalance) refreshKasBalance();
  }, [canPayWithL1, refreshKasBalance]);

  const kasLoading = canPayWithL1 && (kasBalanceStr === null || kasBalanceStr === undefined);
  const kasBalanceNum = kasBalanceStr != null ? parseFloat(String(kasBalanceStr)) : 0;
  const kasValid = !Number.isNaN(kasBalanceNum);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Left Column: Mining Area */}
      <div className="lg:col-span-8 flex flex-col space-y-8">
        {/* KREX + KAS balance + tier - theme aware */}
        <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-base flex-wrap gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-zinc-500 dark:text-zinc-400 font-semibold tracking-wide">KREX (L1)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
              {krexL1Balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} KREX
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 font-semibold tracking-wide">KAS</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold tabular-nums">
              {kasLoading ? '…' : kasValid ? kasBalanceNum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 }) : '0'} KAS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-semibold border border-zinc-300 dark:border-zinc-700">
              {krexTier}
            </span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Hold KREX for yield bonus & shop discount · Pay with KREX or KAS in Garage</p>
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
                Refine at <span className="text-zinc-800 dark:text-zinc-300 font-semibold">{refineMinDiamonds}+ diamonds</span> · Wait 30+ min after last refine for 1.5× time bonus · Points fund the rewards pool
              </p>
            </div>

            <button
              onClick={refineDiamonds}
              disabled={diamonds < refineMinDiamonds}
              className="k-cta-primary h-16 px-8 text-lg group relative active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
            >
              REFINE NOW
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
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 ring-4 ring-emerald-500/10 transition-all group-hover:ring-emerald-500/30">
                      <span className="text-3xl">💎</span>
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">#{slot.nftId}</h3>
                    {tier && tier !== 'regular' && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase">
                        {tier}
                      </span>
                    )}
                    <div className="mt-2 flex flex-wrap justify-center gap-1">
                      {meta?.traits?.map((trait, i) => {
                        const bonus = getBonusForTrait(String(trait.value));
                        if (!bonus) return null;
                        return (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase">
                            {bonus.type} +{(bonus.value * 100).toFixed(0)}%
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase mt-2">ACTIVE</p>
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
      </div>

      {/* Right Column: Featured image, lore, description, Garage Shop */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        {/* Featured image + lore at top */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-100 dark:bg-zinc-900/50">
          {featuredImage && (
            <div className="aspect-video w-full bg-zinc-200 dark:bg-zinc-800 relative">
              <img src={featuredImage} alt="Diamond Veins of Kaspaland" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-5">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">The Diamond Veins of Kaspaland</h2>
            {gameDescription && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">{gameDescription}</p>
            )}
            {loreStory && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {loreExpanded ? (
                  <div className="whitespace-pre-line">{loreStory}</div>
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

        {/* Garage Shop */}
        <div className="flex-1 p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl">
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
              const canAffordKAS = canPayWithL1 && kasValid && kasBalanceNum >= item.priceKAS * 0.999;
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
                      onClick={() => buyBoost(item.id, item.name, item.price, item.type, item.mult)}
                      className="px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isBuying ? '…' : 'Pay KREX'}
                    </button>
                    <button
                      type="button"
                      disabled={!canPayWithL1 || kasLoading || !canAffordKAS || isBuying}
                      onClick={() => buyBoostWithKAS(item.id, item.name, item.priceKAS, item.type, item.mult)}
                      className="px-3 py-2 rounded-lg text-sm font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {kasLoading ? '…' : isBuying ? '…' : 'Pay KAS'}
                    </button>
                  </div>
                  {!canPayWithL1 && <span className="block mt-1 text-xs text-zinc-500 dark:text-zinc-500">Connect KasWare wallet</span>}
                  {canPayWithL1 && !canAffordKREX && !canAffordKAS && !kasLoading && <span className="block mt-1 text-xs text-amber-600 dark:text-amber-500">Insufficient KREX & KAS</span>}
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
                <p className="font-semibold text-zinc-800 dark:text-zinc-300">How do I get rewards?</p>
                <p className="mt-1">Mine diamonds, then click <strong>Refine Now</strong> when you have at least {refineMinDiamonds} diamonds. You earn <strong>refinement points</strong> (more if you wait 30+ minutes between refines). These points are recorded and used by the Kasparex rewards system to distribute a share of the Diamond Veins rewards pool. Rewards are not time-gated; you can refine whenever you meet the minimum.</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-300">Why are Pay KAS buttons disabled?</p>
                <p className="mt-1">Paying with KAS requires the <strong>KasWare</strong> browser extension to be installed and connected. If you use another wallet, connect with KasWare on this page to enable KAS (and KREX) payments. Make sure you have enough KAS for the item price and network fees.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedSlotIndex !== null && (
        <NFTSlotSelector slotIndex={selectedSlotIndex} isOpen={true} onClose={() => setSelectedSlotIndex(null)} />
      )}
    </div>
  );
}
