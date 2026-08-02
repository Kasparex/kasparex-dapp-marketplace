'use client';

import { useMemo, useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { useGamesMainAdaptiveGrid } from '@/components/games/layout/GamesLayoutContext';
import { useHubPayWithCatalog } from '@/hooks/useHubPayWithCatalog';
import { fromKasEq } from '@/lib/pricing/registry';
import { PRECISION_SHOP_ITEMS, type PrecisionShopItemId } from '@/lib/game/precision-click/config';
import type { PrecisionClickInventory, PrecisionClickBoosterState } from '@/lib/game/precision-click/types';

export function PrecisionClickShopPanel(props: {
  inventory: PrecisionClickInventory;
  booster: PrecisionClickBoosterState | null;
  buyBusyId: string | null;
  getKasPriceAfterDiscount: (listKas: number) => number;
  onBuy: (args: { itemId: PrecisionShopItemId; currency: 'KAS' | 'KREX'; quantity?: number }) => Promise<boolean>;
}) {
  const gridClass = useGamesMainAdaptiveGrid();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const { pricingSnapshot } = useHubPayWithCatalog();

  const items = useMemo(() => {
    let list = [...PRECISION_SHOP_ITEMS];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q),
      );
    }
    if (category !== 'all') {
      list = list.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    }
    if (sortBy === 'price_asc') list.sort((a, b) => a.listKas - b.listKas);
    if (sortBy === 'price_desc') list.sort((a, b) => b.listKas - a.listKas);
    return list;
  }, [searchQuery, category, sortBy]);

  return (
    <div className="space-y-6">
      <GamePanelCard title="ARIA Shop" hint="Boosters and run items.">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Buy time-limited fragment boosters or consumable items. Active boosters stack with your KREX tier and NFT deck
          bonuses in Play. Owned charges show on the Calculation breakdown rail.
        </p>
        {props.booster ? (
          <p className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Active: ×{props.booster.mult} until {new Date(props.booster.until).toLocaleString()}
          </p>
        ) : null}
      </GamePanelCard>

      <CardsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        category={category}
        onCategoryChange={setCategory}
        categories={['Booster', 'Item', 'Chrono']}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className={gridClass}>
        {items.map((item) => {
          const discounted = props.getKasPriceAfterDiscount(item.listKas);
          const krexUnit = fromKasEq(discounted, 'KREX', pricingSnapshot);
          const owned =
            item.effect === 'shard_lens'
              ? props.inventory.shard_lens
              : item.effect === 'null_filter'
                ? props.inventory.null_filter
                : undefined;
          return (
            <GameItemCard
              key={item.id}
              title={item.title}
              titleTooltip={item.tooltip}
              category={item.category}
              imageSrc={item.imageSrc}
              description={item.description}
              ownedCount={owned}
              priceOptions={[
                {
                  currency: 'KAS',
                  unitPrice: discounted,
                  originalUnitPrice: item.listKas !== discounted ? item.listKas : undefined,
                },
                {
                  currency: 'KREX',
                  unitPrice: krexUnit ?? 0,
                  disabled: krexUnit == null,
                },
              ]}
              buyLabel={props.buyBusyId === item.id ? 'Buying…' : 'Buy'}
              buyDisabled={props.buyBusyId === item.id}
              onBuy={async ({ currency }) => {
                await props.onBuy({
                  itemId: item.id,
                  currency: currency === 'KREX' ? 'KREX' : 'KAS',
                });
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
