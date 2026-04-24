'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import type { GameItemCurrency } from '@/components/games/shop/GameItemCard';

export function ShopPanel(props: {
  onBuy: (args: { itemId: string; currency: GameItemCurrency; quantity: number }) => void | Promise<void>;
}) {
  return (
    <GamePanelCard title="Shop" hint="V1 items. Payments will expand over time.">
      <div className="grid gap-4 sm:grid-cols-2">
        <GameItemCard
          title="KAS Overclock"
          category="Boost"
          description="Increase the next cycle output for one plant. V1 mock boost."
          effects={[{ label: 'Output', value: '+100%' }]}
          priceOptions={[{ currency: 'KAS', unitPrice: 1 }]}
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
          priceOptions={[{ currency: 'KAS', unitPrice: 0.2 }]}
          quantitySelector={{ min: 1, max: 10 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuy({ itemId: 'power-topup', currency, quantity })}
        />
        <GameItemCard
          title="Stability Patch"
          category="Repair"
          description="Repair a plant marked as Needs repair. V1 mock utility."
          effects={[{ label: 'Repair', value: 'Clear' }]}
          priceOptions={[{ currency: 'KAS', unitPrice: 0.5 }]}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuy({ itemId: 'repair', currency, quantity })}
        />
      </div>
    </GamePanelCard>
  );
}

