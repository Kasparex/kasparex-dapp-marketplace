'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { IconBoosters, IconBot, IconSignal } from '@/components/games/icons/TabIcons';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { useGamesMainAdaptiveWideGrid } from '@/components/games/layout/GamesLayoutContext';
import { DIAMOND_VEINS_CONSUMABLES } from '@/lib/game/diamond-veins-config';
import type { BonusType } from '@/lib/game/diamond-bonuses';
import type { DiamondVeinsConsumableId } from '@/lib/game/engine';

const GARAGE_ITEMS = [
  { id: 'nitrogen-overclock', name: "Vector's Overclock", price: 100, priceKAS: 0.5, desc: '+25% Yield (1h)', icon: <IconBoosters />, type: 'yield' as const, mult: 0.25 },
  { id: 'crystal-resonance', name: 'Crystal Resonance', price: 500, priceKAS: 2, desc: '+50% Rare Drops', icon: <IconSignal />, type: 'luck' as const, mult: 0.5 },
  { id: 'ai-auto-refiner', name: 'ARIA Auto-Refiner', price: 2500, priceKAS: 10, desc: 'Auto-claim every 4h', icon: <IconBot />, type: 'efficiency' as const, mult: 0.1 },
];

export function UpgradesPanel({
  canPayWithL1,
  krexL1Balance,
  kasBalance,
  kasBalanceLoading,
  krexTier,
  getKasPriceAfterDiscount,
  buyingItemId,
  revenuePoolPct,
  consumables,
  onBuyKrex,
  onBuyKas,
  onBuyConsumable,
}: {
  canPayWithL1: boolean;
  krexL1Balance: number;
  kasBalance: number;
  kasBalanceLoading: boolean;
  krexTier: string;
  getKasPriceAfterDiscount: (n: number) => number;
  buyingItemId: string | null;
  revenuePoolPct: number;
  consumables: Record<DiamondVeinsConsumableId, number>;
  onBuyKrex: (item: (typeof GARAGE_ITEMS)[0]) => void;
  onBuyKas: (item: (typeof GARAGE_ITEMS)[0]) => void;
  onBuyConsumable: (id: DiamondVeinsConsumableId, currency: 'KAS' | 'KREX') => void | Promise<boolean>;
}) {
  const kasValid = typeof kasBalance === 'number' && !Number.isNaN(kasBalance);
  const kasBalanceNum = kasValid ? kasBalance : 0;
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const shopGridClass = useGamesMainAdaptiveWideGrid('gap-6');

  const categories = ['consumable', ...Array.from(new Set(GARAGE_ITEMS.map((i) => i.type)))];

  const filteredBoosts = [...GARAGE_ITEMS]
    .filter((item) => {
      if (category !== 'all' && category !== 'consumable' && item.type !== category) return false;
      if (category === 'consumable') return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.priceKAS - b.priceKAS;
      if (sortBy === 'price_desc') return b.priceKAS - a.priceKAS;
      return 0;
    });

  const showConsumables = category === 'all' || category === 'consumable';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <GameTooltip
            title="Shop rules"
            description="Buy consumables to restore worker energy, or timed boosts for higher Diamond flow. KREX tiers discount KAS prices."
          >
            <span className="cursor-help border-b border-dotted border-zinc-400 font-semibold text-zinc-800 dark:text-zinc-200">
              Shop rules
            </span>
          </GameTooltip>
          : tier <strong>{krexTier}</strong> · KasWare/Kastle for payments.
        </p>
      </div>

      {!canPayWithL1 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
          Connect <strong>KasWare</strong> to pay with KREX or KAS.
        </div>
      )}

      <CardsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {showConsumables ? (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Worker supplies</h2>
          <div className={shopGridClass}>
            {DIAMOND_VEINS_CONSUMABLES.filter((c) =>
              searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) : true,
            ).map((item) => {
              const kasPrice = getKasPriceAfterDiscount(item.priceKAS);
              const owned = consumables[item.id] ?? 0;
              return (
                <div
                  key={item.id}
                  className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{item.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{item.desc}</p>
                  <p className="mt-2 text-xs font-semibold text-zinc-500">Owned ×{owned}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <button
                      type="button"
                      disabled={!canPayWithL1 || buyingItemId === item.id || kasBalanceNum < kasPrice}
                      onClick={() => void onBuyConsumable(item.id, 'KAS')}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                    >
                      {kasPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS
                    </button>
                    <button
                      type="button"
                      disabled={!canPayWithL1 || buyingItemId === item.id || krexL1Balance < item.priceKrex}
                      onClick={() => void onBuyConsumable(item.id, 'KREX')}
                      className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-800 dark:border-zinc-600 dark:text-zinc-200 disabled:opacity-40"
                    >
                      {item.priceKrex} KREX
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {category !== 'consumable' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Timed boosts</h2>
            <span className="rounded-full border border-zinc-300 bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              Garage
            </span>
          </div>
          <div className={shopGridClass}>
            {filteredBoosts.map((item) => {
              const kasPriceAfterDiscount = getKasPriceAfterDiscount(item.priceKAS);
              const canAffordKREX = canPayWithL1 && krexL1Balance >= item.price;
              const canAffordKAS = canPayWithL1 && !kasBalanceLoading && kasBalanceNum >= kasPriceAfterDiscount * 0.999;
              const isBuying = buyingItemId === item.id;

              return (
                <GameItemCard
                  key={item.id}
                  icon={
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-emerald-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-emerald-300">
                      {item.icon}
                    </span>
                  }
                  title={item.name}
                  category="Shop"
                  description={
                    <span>
                      {item.desc}{' '}
                      <span className="text-zinc-500 dark:text-zinc-500">· pool +{revenuePoolPct}%</span>
                    </span>
                  }
                  effects={[
                    { label: 'Per unit', value: item.desc },
                    { label: 'Type', value: item.type.toUpperCase() },
                  ]}
                  priceOptions={[
                    {
                      currency: 'KAS',
                      unitPrice: kasPriceAfterDiscount,
                      originalUnitPrice: item.priceKAS,
                      disabled: !canAffordKAS || kasBalanceLoading,
                    },
                    {
                      currency: 'KREX',
                      unitPrice: item.price,
                      disabled: !canAffordKREX,
                    },
                  ]}
                  defaultCurrency="KAS"
                  buyDisabled={!canPayWithL1 || isBuying}
                  buyLabel={isBuying ? '…' : 'Buy'}
                  onBuy={async ({ currency }) => {
                    if (currency === 'KREX') {
                      await onBuyKrex(item);
                      return;
                    }
                    await onBuyKas(item);
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        {revenuePoolPct}% of Garage revenue supports the rewards pool. Redeem Diamonds into Hub points on{' '}
        <Link href="/rewards" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
          Rewards
        </Link>
        .
        {kasBalanceLoading ? ' Refreshing KAS balance…' : null}
      </p>
    </div>
  );
}

export type { BonusType };
