'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import type { GameItemCurrency } from '@/components/games/shop/GameItemCard';
import type { MinecoreIngredient } from '@/lib/game/minecore';

export function ShopPanel(props: {
  onBuy: (args: { itemId: string; currency: GameItemCurrency; quantity: number }) => void | Promise<void>;
  onBuyIngredient: (args: { ingredient: MinecoreIngredient; currency: GameItemCurrency; quantity: number }) => void | Promise<void>;
  getKasPriceAfterDiscount: (unitPriceKas: number) => number;
}) {
  return (
    <GamePanelCard title="Shop" hint="Ingredients and utilities. Quantity calculates total price.">
      <div className="grid gap-4 sm:grid-cols-2">
        <GameItemCard
          title="Crystal Dust"
          category="Ingredient"
          description="Basic crystal substrate used in fabrication."
          priceOptions={[
            { currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(0.5), originalUnitPrice: 0.5 },
            { currency: 'KREX', unitPrice: 0.5 },
          ]}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'crystalDust', currency, quantity })}
        />
        <GameItemCard
          title="Alloy Plates"
          category="Ingredient"
          description="Structural plates for rigs and modules."
          priceOptions={[
            { currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(2), originalUnitPrice: 2 },
            { currency: 'KREX', unitPrice: 1.2 },
          ]}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'alloyPlates', currency, quantity })}
        />
        <GameItemCard
          title="Circuit Mesh"
          category="Ingredient"
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
        <GameItemCard
          title="Energy Cells"
          category="Ingredient"
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

        <GameItemCard
          title="KAS Overclock"
          category="Boost"
          description="Increase the next cycle output for one plant. V1 mock boost."
          effects={[{ label: 'Output', value: '+100%' }]}
          priceOptions={[{ currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(5), originalUnitPrice: 5 }]}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuy({ itemId: 'kas-overclock', currency, quantity })}
        />
        <GameItemCard
          title="KREX Boost"
          category="Boost"
          description="Apply a yield multiplier. Later this will read your KREX tier and holdings."
          effects={[{ label: 'Output', value: '+50%' }]}
          priceOptions={[{ currency: 'KREX', unitPrice: 25 }]}
          buyDisabled={true}
          buyLabel="Soon"
          onBuy={({ currency, quantity }) => props.onBuy({ itemId: 'krex-boost', currency, quantity })}
        />
        <GameItemCard
          title="Power Top-up"
          category="Utility"
          description="Add 1 power to a selected plant. V1 mock utility."
          effects={[{ label: 'Power', value: '+1' }]}
          priceOptions={[{ currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(1), originalUnitPrice: 1 }]}
          quantitySelector={{ min: 1, max: 10 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuy({ itemId: 'power-topup', currency, quantity })}
        />
        <GameItemCard
          title="Stability Patch"
          category="Repair"
          description="Repair a plant marked as Needs repair. V1 mock utility."
          effects={[{ label: 'Repair', value: 'Clear' }]}
          priceOptions={[{ currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(2), originalUnitPrice: 2 }]}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuy({ itemId: 'repair', currency, quantity })}
        />
      </div>
    </GamePanelCard>
  );
}

