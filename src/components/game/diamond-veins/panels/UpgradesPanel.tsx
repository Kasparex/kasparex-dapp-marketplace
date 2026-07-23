'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { IconBoosters, IconBot, IconSignal } from '@/components/games/icons/TabIcons';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { useGamesMainAdaptiveWideGrid } from '@/components/games/layout/GamesLayoutContext';
import { DIAMOND_VEINS_CONSUMABLES } from '@/lib/game/diamond-veins-config';
import type { BonusType } from '@/lib/game/diamond-bonuses';
import type { DiamondVeinsConsumableId } from '@/lib/game/engine';
import * as Icons from 'lucide-react';

const SHOP_BOOSTS = [
  { id: 'nitrogen-overclock', name: "Vector's Overclock", price: 100, priceKAS: 0.5, desc: '+25% Yield (1h)', icon: <IconBoosters />, type: 'yield' as const, mult: 0.25 },
  { id: 'crystal-resonance', name: 'Crystal Resonance', price: 500, priceKAS: 2, desc: '+50% Rare Drops', icon: <IconSignal />, type: 'luck' as const, mult: 0.5 },
  { id: 'ai-auto-refiner', name: 'ARIA Auto-Refiner', price: 2500, priceKAS: 10, desc: 'Auto-claim every 4h', icon: <IconBot />, type: 'efficiency' as const, mult: 0.1 },
];

const CONSUMABLE_ICONS: Record<DiamondVeinsConsumableId, ReactNode> = {
  'field-ration': <Icons.Utensils className="h-5 w-5" />,
  'energy-drink': <Icons.Zap className="h-5 w-5" />,
  'repair-kit': <Icons.Wrench className="h-5 w-5" />,
};

export function UpgradesPanel({
  canPayWithL1,
  krexL1Balance,
  kasBalance: _kasBalance,
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
  onBuyKrex: (item: (typeof SHOP_BOOSTS)[0], quantity: number) => void;
  onBuyKas: (item: (typeof SHOP_BOOSTS)[0], quantity: number) => void;
  onBuyConsumable: (
    id: DiamondVeinsConsumableId,
    currency: 'KAS' | 'KREX',
    quantity: number,
  ) => void | Promise<boolean>;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const shopGridClass = useGamesMainAdaptiveWideGrid('gap-6');
  void _kasBalance;
  const categories = ['supplies', 'boosts', 'yield', 'luck', 'efficiency'];

  type ShopRow =
    | { kind: 'supply'; item: (typeof DIAMOND_VEINS_CONSUMABLES)[number] }
    | { kind: 'boost'; item: (typeof SHOP_BOOSTS)[number] };

  const rows: ShopRow[] = [
    ...DIAMOND_VEINS_CONSUMABLES.map((item) => ({ kind: 'supply' as const, item })),
    ...SHOP_BOOSTS.map((item) => ({ kind: 'boost' as const, item })),
  ]
    .filter((row) => {
      if (category === 'supplies') return row.kind === 'supply';
      if (category === 'boosts') return row.kind === 'boost';
      if (category === 'yield' || category === 'luck' || category === 'efficiency') {
        return row.kind === 'boost' && row.item.type === category;
      }
      return true;
    })
    .filter((row) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      if (row.kind === 'supply') return row.item.name.toLowerCase().includes(q);
      return row.item.name.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const priceA = a.kind === 'supply' ? a.item.priceKAS : a.item.priceKAS;
      const priceB = b.kind === 'supply' ? b.item.priceKAS : b.item.priceKAS;
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <GameTooltip
            title="Shop rules"
            description="Buy worker supplies to restore energy, or boosts for higher Diamond flow. KREX tier discount applies to the full KAS price."
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

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Shop</h2>
          <span className="rounded-full border border-zinc-300 bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            Supplies & boosts
          </span>
        </div>
        <div className={shopGridClass}>
          {rows.map((row) => {
            if (row.kind === 'supply') {
              const item = row.item;
              const kasPrice = getKasPriceAfterDiscount(item.priceKAS);
              const owned = consumables[item.id] ?? 0;
              const isBuying = buyingItemId === item.id;
              return (
                <GameItemCard
                  key={item.id}
                  icon={
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-emerald-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-emerald-300">
                      {CONSUMABLE_ICONS[item.id]}
                    </span>
                  }
                  title={item.name}
                  category="Supplies"
                  description={item.desc}
                  effects={[
                    { label: 'Owned', value: `×${owned}` },
                    { label: 'Restore', value: `${Math.round(item.restorePct * 100)}% energy` },
                  ]}
                  priceOptions={[
                    {
                      currency: 'KAS',
                      unitPrice: kasPrice,
                      originalUnitPrice: item.priceKAS,
                      disabled: !canPayWithL1 || kasBalanceLoading,
                    },
                    {
                      currency: 'KREX',
                      unitPrice: item.priceKrex,
                      disabled: !canPayWithL1,
                    },
                  ]}
                  defaultCurrency="KAS"
                  quantitySelector={{ min: 1, max: 99 }}
                  buyDisabled={!canPayWithL1 || isBuying}
                  buyLabel={isBuying ? '…' : 'Buy'}
                  onBuy={async ({ currency, quantity }) => {
                    await onBuyConsumable(item.id, currency === 'KREX' ? 'KREX' : 'KAS', quantity);
                  }}
                />
              );
            }

            const item = row.item;
            const kasPriceAfterDiscount = getKasPriceAfterDiscount(item.priceKAS);
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
                category="Boosts"
                description={
                  <span>
                    {item.desc}{' '}
                    <span className="text-zinc-500 dark:text-zinc-500">· pool +{revenuePoolPct}%</span>
                  </span>
                }
                effects={[
                  { label: 'Effect', value: item.desc },
                  { label: 'Type', value: item.type.toUpperCase() },
                ]}
                priceOptions={[
                  {
                    currency: 'KAS',
                    unitPrice: kasPriceAfterDiscount,
                    originalUnitPrice: item.priceKAS,
                    disabled: !canPayWithL1 || kasBalanceLoading,
                  },
                  {
                    currency: 'KREX',
                    unitPrice: item.price,
                    disabled: !canPayWithL1,
                  },
                ]}
                defaultCurrency="KAS"
                quantitySelector={{ min: 1, max: 20 }}
                buyDisabled={!canPayWithL1 || isBuying}
                buyLabel={isBuying ? '…' : 'Buy'}
                onBuy={async ({ currency, quantity }) => {
                  if (currency === 'KREX') {
                    await onBuyKrex(item, quantity);
                    return;
                  }
                  await onBuyKas(item, quantity);
                }}
              />
            );
          })}
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        {revenuePoolPct}% of Shop revenue supports the rewards pool. Refine Diamonds into Hub points on{' '}
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
