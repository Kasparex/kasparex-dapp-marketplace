'use client';

import { useMemo, useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { useGamesMainAdaptiveGrid } from '@/components/games/layout/GamesLayoutContext';
import { useHubPayWithCatalog } from '@/hooks/useHubPayWithCatalog';
import { fromKasEq } from '@/lib/pricing/registry';
import { CIPHER_SHOP_ITEMS, type CipherShopItemId } from '@/lib/game/cipher-vaults-config';
import type { CipherBoosterState, CipherInventory } from '@/lib/game/cipher-vaults-types';

export function CipherVaultsShopPanel(props: {
  inventory: CipherInventory;
  booster: CipherBoosterState | null;
  buyBusyId: string | null;
  getKasPriceAfterDiscount: (listKas: number) => number;
  onBuy: (args: { itemId: CipherShopItemId; currency: 'KAS' | 'KREX'; quantity?: number }) => Promise<boolean>;
}) {
  const gridClass = useGamesMainAdaptiveGrid();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const { pricingSnapshot } = useHubPayWithCatalog();

  const items = useMemo(() => {
    let list = [...CIPHER_SHOP_ITEMS];
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
      <GamePanelCard title="Cipher Shop" hint="Boosters, hints, passes, chrono.">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Buy time-limited fragment boosters, Rune Hints, Vault Passes, and Chrono Seals that extend your open covenant
          window. Active tools show on the Calculation breakdown rail.
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
            item.effect === 'rune_hint'
              ? props.inventory.rune_hint
              : item.effect === 'vault_pass'
                ? props.inventory.vault_pass
                : undefined;
          return (
            <GameItemCard
              key={item.id}
              title={item.title}
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
