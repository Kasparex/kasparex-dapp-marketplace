'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { IconBoosters, IconBot, IconSignal } from '@/components/games/icons/TabIcons';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { useGamesMainAdaptiveWideGrid } from '@/components/games/layout/GamesLayoutContext';

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
  onBuyKrex,
  onBuyKas,
}: {
  canPayWithL1: boolean;
  krexL1Balance: number;
  kasBalance: number;
  kasBalanceLoading: boolean;
  krexTier: string;
  getKasPriceAfterDiscount: (n: number) => number;
  buyingItemId: string | null;
  revenuePoolPct: number;
  onBuyKrex: (item: (typeof GARAGE_ITEMS)[0]) => void;
  onBuyKas: (item: (typeof GARAGE_ITEMS)[0]) => void;
}) {
  const kasValid = typeof kasBalance === 'number' && !Number.isNaN(kasBalance);
  const kasBalanceNum = kasValid ? kasBalance : 0;
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const shopGridClass = useGamesMainAdaptiveWideGrid('gap-6');

  const categories = Array.from(new Set(GARAGE_ITEMS.map((i) => i.type)));

  const filteredItems = [...GARAGE_ITEMS].filter(item => {
    if (category !== 'all' && item.type !== category) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.priceKAS - b.priceKAS;
    if (sortBy === 'price_desc') return b.priceKAS - a.priceKAS;
    return 0; // recommended
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <GameTooltip
            title="Shop rules"
            description="Higher KREX tiers reduce Garage KREX prices. The KAS path uses native L1 sends to the Garage address; receipts are registered server-side for idempotent purchases."
          >
            <span className="cursor-help border-b border-dotted border-zinc-400 font-semibold text-zinc-800 dark:text-zinc-200">
              Shop rules
            </span>
          </GameTooltip>
          : tier <strong>{krexTier}</strong> · KasWare/Kastle for payments.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Shop</h2>
        <span className="rounded-full border border-zinc-300 bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          Items
        </span>
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

      <div className={shopGridClass}>
        {filteredItems.map((item) => {
          const kasPriceAfterDiscount = getKasPriceAfterDiscount(item.priceKAS);
          const canAffordKREX = canPayWithL1 && krexL1Balance >= item.price;
          const canAffordKAS = canPayWithL1 && !kasBalanceLoading && kasBalanceNum >= kasPriceAfterDiscount * 0.999;
          const isBuying = buyingItemId === item.id;

          return (
            <GameItemCard
              key={item.id}
              icon={<span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-emerald-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-emerald-300">{item.icon}</span>}
              title={item.name}
              category="Shop"
              description={
                <span>
                  {item.desc}{' '}
                  <span className="text-zinc-500 dark:text-zinc-500">
                    · pool +{revenuePoolPct}%
                  </span>
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

      <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
        <p className="text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          {revenuePoolPct}% of Garage revenue goes to the Diamond Veins rewards pool
        </p>
      </div>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
        GRID claims use <Link href="/rewards" className="font-semibold text-emerald-600 underline dark:text-emerald-400">Rewards &amp; Points</Link> ·{' '}
        <Link href="/rewards" className="underline">
          Rewards
        </Link>
      </p>
    </div>
  );
}
