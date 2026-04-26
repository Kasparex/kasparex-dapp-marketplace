'use client';

import { useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import type { GameItemCurrency } from '@/components/games/shop/GameItemCard';
import type { MinecoreIngredient } from '@/lib/game/minecore';
import { MINECORE_PLANT_RECHARGE_COST_KAS } from '@/lib/game/minecore/config';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';

export function ShopPanel(props: {
  onBuy: (args: { itemId: string; currency: GameItemCurrency; quantity: number }) => void | Promise<void>;
  onBuyIngredient: (args: { ingredient: MinecoreIngredient; currency: GameItemCurrency; quantity: number }) => void | Promise<void>;
  getKasPriceAfterDiscount: (unitPriceKas: number) => number;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  const items = [
    {
      id: 'crystalDust',
      title: 'Crystal Dust',
      category: 'Ingredient',
      description: 'Basic crystal substrate used in fabrication.',
      baseKasPrice: 0.5,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="crystalDust"
          title="Crystal Dust"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_ebe4ca7ed61a450ca4c0f547b5c567c3~mv2.jpg"
          description="Basic crystal substrate used in fabrication."
          priceOptions={[
            { currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(0.5), originalUnitPrice: 0.5 },
            { currency: 'KREX', unitPrice: 0.5 },
          ]}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'crystalDust', currency, quantity })}
        />
      ),
    },
    {
      id: 'alloyPlates',
      title: 'Alloy Plates',
      category: 'Ingredient',
      description: 'Structural plates for rigs and modules.',
      baseKasPrice: 2,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="alloyPlates"
          title="Alloy Plates"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_6d286f563d3647e1bffa064743a964dc~mv2.jpg"
          description="Structural plates for rigs and modules."
          priceOptions={[
            { currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(2), originalUnitPrice: 2 },
            { currency: 'KREX', unitPrice: 1.2 },
          ]}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'alloyPlates', currency, quantity })}
        />
      ),
    },
    {
      id: 'circuitMesh',
      title: 'Circuit Mesh',
      category: 'Ingredient',
      description: 'Control mesh for machine interfaces.',
      baseKasPrice: 1.5,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="circuitMesh"
          title="Circuit Mesh"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_7721a64db1da45929e94b9d96b3a668b~mv2.jpg"
          description="Control mesh for machine interfaces."
          priceOptions={[
            { currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(1.5), originalUnitPrice: 1.5 },
            { currency: 'KREX', unitPrice: 1.0 },
            { currency: 'GRID', unitPrice: 0.4 },
          ]}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'circuitMesh', currency, quantity })}
        />
      ),
    },
    {
      id: 'energyCells',
      title: 'Energy Cells',
      category: 'Ingredient',
      description: 'Compact energy units used in power systems.',
      baseKasPrice: 3,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="energyCells"
          title="Energy Cells"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_6ec39904e3c2471d9dcfcde1aea447a2~mv2.jpg"
          description="Compact energy units used in power systems."
          priceOptions={[
            { currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(3), originalUnitPrice: 3 },
            { currency: 'KREX', unitPrice: 2.5 },
            { currency: 'GRID', unitPrice: 0.3 },
          ]}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'energyCells', currency, quantity })}
        />
      ),
    },
    {
      id: 'kas-overclock',
      title: 'KAS Overclock',
      category: 'Boost',
      description: 'Increase the next cycle output for one plant. V1 mock boost.',
      baseKasPrice: 5,
      type: 'item' as const,
      render: () => (
        <GameItemCard
          key="kas-overclock"
          title="KAS Overclock"
          category="Boost"
          imageSrc="https://static.wixstatic.com/media/de4185_5fd245ec2afe4a1e9a3c495261924b99~mv2.jpg"
          description="Increase the next cycle output for one plant. V1 mock boost."
          effects={[{ label: 'Output', value: '+100%' }]}
          priceOptions={[{ currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(5), originalUnitPrice: 5 }]}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuy({ itemId: 'kas-overclock', currency, quantity })}
        />
      ),
    },
    {
      id: 'krex-boost',
      title: 'KREX Boost',
      category: 'Boost',
      description: 'Apply a yield multiplier. Later this will read your KREX tier and holdings.',
      baseKasPrice: 0,
      type: 'item' as const,
      render: () => (
        <GameItemCard
          key="krex-boost"
          title="KREX Boost"
          category="Boost"
          imageSrc="https://static.wixstatic.com/media/de4185_82bfb57dc94e463788ab6bccd155249e~mv2.jpg"
          description="Apply a yield multiplier. Later this will read your KREX tier and holdings."
          effects={[{ label: 'Output', value: '+50%' }]}
          priceOptions={[{ currency: 'KREX', unitPrice: 25 }]}
          buyDisabled={true}
          buyLabel="Soon"
          onBuy={({ currency, quantity }) => props.onBuy({ itemId: 'krex-boost', currency, quantity })}
        />
      ),
    },
    {
      id: 'power-topup',
      title: 'Plant recharge',
      category: 'Utility',
      description: 'Adds reserve units and fully recharges the battery on plant 1 (same as the in-plant Recharge action).',
      baseKasPrice: MINECORE_PLANT_RECHARGE_COST_KAS,
      type: 'item' as const,
      render: () => (
        <GameItemCard
          key="power-topup"
          title="Plant recharge"
          category="Utility"
          imageSrc="https://static.wixstatic.com/media/de4185_1584ecece1e5489dbf13f7d111c44d99~mv2.jpg"
          description="Each purchase adds reserve power units and tops up the battery for the first mining plant."
          effects={[
            { label: 'Per unit', value: `+1 reserve & full battery (${MINECORE_PLANT_RECHARGE_COST_KAS} KAS)` },
          ]}
          priceOptions={[
            {
              currency: 'KAS',
              unitPrice: props.getKasPriceAfterDiscount(MINECORE_PLANT_RECHARGE_COST_KAS),
              originalUnitPrice: MINECORE_PLANT_RECHARGE_COST_KAS,
            },
          ]}
          quantitySelector={{ min: 1, max: 10 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuy({ itemId: 'power-topup', currency, quantity })}
        />
      ),
    },
    {
      id: 'repair',
      title: 'Stability Patch',
      category: 'Repair',
      description: 'Repair a plant marked as Needs repair. V1 mock utility.',
      baseKasPrice: 2,
      type: 'item' as const,
      render: () => (
        <GameItemCard
          key="repair"
          title="Stability Patch"
          category="Repair"
          imageSrc="https://static.wixstatic.com/media/de4185_c5a695694e8f4cae8ba74e2b46b786eb~mv2.jpg"
          description="Repair a plant marked as Needs repair. V1 mock utility."
          effects={[{ label: 'Repair', value: 'Clear' }]}
          priceOptions={[{ currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(2), originalUnitPrice: 2 }]}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuy({ itemId: 'repair', currency, quantity })}
        />
      ),
    },
  ];

  const categories = Array.from(new Set(items.map((i) => i.category)));

  const filteredItems = items
    .filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.baseKasPrice - b.baseKasPrice;
      if (sortBy === 'price_desc') return b.baseKasPrice - a.baseKasPrice;
      return 0; // recommended
    });

  return (
    <GamePanelCard title="Shop" hint="Ingredients and utilities. Quantity calculates total price.">
      <CardsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredItems.map((item) => item.render())}
      </div>
    </GamePanelCard>
  );
}

