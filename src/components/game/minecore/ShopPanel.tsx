'use client';

import { useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import type { GameItemCurrency } from '@/components/games/shop/GameItemCard';
import type { MinecoreIngredient, MinecoreState } from '@/lib/game/minecore';
import { MINECORE_PLANT_RECHARGE_COST_KAS } from '@/lib/game/minecore/config';
import { CALC_INGREDIENT_KAS, CALC_INGREDIENT_KREX, CALC_INGREDIENT_GRID } from '@/lib/game/minecore/calculator';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { MinecoreOwnedIngredientsPanel } from '@/components/game/minecore/MinecoreOwnedAssetsPanel';

const ENERGY_CELLS_SHOP_IMAGE =
  'https://chatgpt.com/backend-api/estuary/content?id=file_00000000ed7c7243b07f0725d59a4a3b&ts=493761&p=fs&cid=1&sig=7c0e575dc68b2c9a2b2f0066c274dac99578872d82c5b61ceea9b9d7c554ce31&v=0';

function shopIngredientPriceOptions(
  ingredient: MinecoreIngredient,
  getKasPriceAfterDiscount: (unitPriceKas: number) => number,
) {
  const base = CALC_INGREDIENT_KAS[ingredient];
  const out: { currency: GameItemCurrency; unitPrice: number; originalUnitPrice?: number; disabled?: boolean }[] = [
    { currency: 'KAS', unitPrice: getKasPriceAfterDiscount(base), originalUnitPrice: base },
  ];
  const kx = CALC_INGREDIENT_KREX[ingredient];
  if (kx != null) out.push({ currency: 'KREX', unitPrice: kx });
  const gd = CALC_INGREDIENT_GRID[ingredient];
  if (gd != null) out.push({ currency: 'GRID', unitPrice: gd });
  return out;
}

export function ShopPanel(props: {
  ingredients: MinecoreState['ingredients'];
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
          priceOptions={shopIngredientPriceOptions('crystalDust', props.getKasPriceAfterDiscount)}
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
          priceOptions={shopIngredientPriceOptions('alloyPlates', props.getKasPriceAfterDiscount)}
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
          priceOptions={shopIngredientPriceOptions('circuitMesh', props.getKasPriceAfterDiscount)}
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
          imageSrc={ENERGY_CELLS_SHOP_IMAGE}
          description="Compact energy units used in power systems."
          priceOptions={shopIngredientPriceOptions('energyCells', props.getKasPriceAfterDiscount)}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'energyCells', currency, quantity })}
        />
      ),
    },
    {
      id: 'fluxCoils',
      title: 'Flux Coils',
      category: 'Ingredient',
      description: 'High-frequency windings for advanced rigs and flux batteries.',
      baseKasPrice: 1.2,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="fluxCoils"
          title="Flux Coils"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_6ec39904e3c2471d9dcfcde1aea447a2~mv2.jpg"
          description="Used in mid-tier machines, Flux Arrays, and Regen Coils."
          priceOptions={shopIngredientPriceOptions('fluxCoils', props.getKasPriceAfterDiscount)}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'fluxCoils', currency, quantity })}
        />
      ),
    },
    {
      id: 'latticeWire',
      title: 'Lattice Wire',
      category: 'Ingredient',
      description: 'Structured conductor mesh for orbit-class hardware.',
      baseKasPrice: CALC_INGREDIENT_KAS.latticeWire,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="latticeWire"
          title="Lattice Wire"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_7721a64db1da45929e94b9d96b3a668b~mv2.jpg"
          description="Required for Orbit Siphon, Void Core Cell, reactor cores, and Hash Buffer crafts."
          priceOptions={shopIngredientPriceOptions('latticeWire', props.getKasPriceAfterDiscount)}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'latticeWire', currency, quantity })}
        />
      ),
    },
    {
      id: 'helixStabilizers',
      title: 'Helix Stabilizers',
      category: 'Ingredient',
      description: 'Twin-helix braces that tame reactor magnetic drift in the Minecore yards.',
      baseKasPrice: CALC_INGREDIENT_KAS.helixStabilizers,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="helixStabilizers"
          title="Helix Stabilizers"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_cdbc21d0648249749f9ea46cbca80d71~mv2.jpg"
          description="Used for Neon-tier reactors, Prismatic assemblies, and the Stellar Forge line."
          priceOptions={shopIngredientPriceOptions('helixStabilizers', props.getKasPriceAfterDiscount)}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'helixStabilizers', currency, quantity })}
        />
      ),
    },
    {
      id: 'plasmaConduits',
      title: 'Plasma Conduits',
      category: 'Ingredient',
      description: 'Ribbon channels that route arc plasma without cooking the bus bars.',
      baseKasPrice: CALC_INGREDIENT_KAS.plasmaConduits,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="plasmaConduits"
          title="Plasma Conduits"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_8e87fe8e88e14bfa87be41e55404f1ae~mv2.jpg"
          description="Key feedstock for Arc reactors and high-density containment stacks."
          priceOptions={shopIngredientPriceOptions('plasmaConduits', props.getKasPriceAfterDiscount)}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'plasmaConduits', currency, quantity })}
        />
      ),
    },
    {
      id: 'quantumAttuners',
      title: 'Quantum Attuners',
      category: 'Ingredient',
      description: 'Cryo-tuned resonators that lock chaotic hash-energy into clean lattice modes.',
      baseKasPrice: CALC_INGREDIENT_KAS.quantumAttuners,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="quantumAttuners"
          title="Quantum Attuners"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_5fd245ec2afe4a1e9a3c495261924b99~mv2.jpg"
          description="Critical for Nexus reactors, advanced bundles, and anomaly-hardened sinks."
          priceOptions={shopIngredientPriceOptions('quantumAttuners', props.getKasPriceAfterDiscount)}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'quantumAttuners', currency, quantity })}
        />
      ),
    },
    {
      id: 'voidglassFilaments',
      title: 'Voidglass Filaments',
      category: 'Ingredient',
      description: 'Hair-thin strands tempered in null-space — they glow when the grid complains.',
      baseKasPrice: CALC_INGREDIENT_KAS.voidglassFilaments,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="voidglassFilaments"
          title="Voidglass Filaments"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_2745d6b902274187b11a8f07356c0c92~mv2.jpg"
          description="Feeds Stellar Forge blueprints and other void-touched high-power crafts."
          priceOptions={shopIngredientPriceOptions('voidglassFilaments', props.getKasPriceAfterDiscount)}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'voidglassFilaments', currency, quantity })}
        />
      ),
    },
    {
      id: 'coreShards',
      title: 'Core Shards',
      category: 'Ingredient',
      description: 'Dense crystalline shards for orbit-class rigs and deep batteries.',
      baseKasPrice: CALC_INGREDIENT_KAS.coreShards,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="coreShards"
          title="Core Shards"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_ebe4ca7ed61a450ca4c0f547b5c567c3~mv2.jpg"
          description="Dense crystalline shards for orbit-class rigs and deep batteries."
          priceOptions={shopIngredientPriceOptions('coreShards', props.getKasPriceAfterDiscount)}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'coreShards', currency, quantity })}
        />
      ),
    },
    {
      id: 'coolingGel',
      title: 'Cooling Gel',
      category: 'Ingredient',
      description: 'Thermal transfer gel for Flux Arrays and cooling modules.',
      baseKasPrice: CALC_INGREDIENT_KAS.coolingGel,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="coolingGel"
          title="Cooling Gel"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_6ec39904e3c2471d9dcfcde1aea447a2~mv2.jpg"
          description="Thermal transfer gel for Flux Arrays and cooling modules."
          priceOptions={shopIngredientPriceOptions('coolingGel', props.getKasPriceAfterDiscount)}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'coolingGel', currency, quantity })}
        />
      ),
    },
    {
      id: 'ariaChips',
      title: 'ARIA Chips',
      category: 'Ingredient',
      description: 'Analog resonance chips for ARIA Sensors and fusion crafts.',
      baseKasPrice: CALC_INGREDIENT_KAS.ariaChips,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="ariaChips"
          title="ARIA Chips"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_7721a64db1da45929e94b9d96b3a668b~mv2.jpg"
          description="Analog resonance chips for ARIA Sensors and fusion crafts."
          priceOptions={shopIngredientPriceOptions('ariaChips', props.getKasPriceAfterDiscount)}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'ariaChips', currency, quantity })}
        />
      ),
    },
    {
      id: 'nullFragments',
      title: 'Null Fragments',
      category: 'Ingredient',
      description: 'Volatile null-state fragments for hash buffers and void tech.',
      baseKasPrice: CALC_INGREDIENT_KAS.nullFragments,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="nullFragments"
          title="Null Fragments"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_5fd245ec2afe4a1e9a3c495261924b99~mv2.jpg"
          description="Volatile null-state fragments for hash buffers and void tech."
          priceOptions={shopIngredientPriceOptions('nullFragments', props.getKasPriceAfterDiscount)}
          quantitySelector={{ min: 1, max: 999 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) => props.onBuyIngredient({ ingredient: 'nullFragments', currency, quantity })}
        />
      ),
    },
    {
      id: 'minecore-reactor-pack-starter',
      title: 'Reactor craft pack (starter)',
      category: 'Bundle',
      description: 'Ingredients tuned for Arc and Neon reactor blueprints.',
      baseKasPrice: 42,
      type: 'item' as const,
      render: () => (
        <GameItemCard
          key="minecore-reactor-pack-starter"
          title="Reactor craft pack (starter)"
          category="Bundle"
          imageSrc="https://static.wixstatic.com/media/de4185_6ec39904e3c2471d9dcfcde1aea447a2~mv2.jpg"
          description="Circuit mesh, energy cells, flux coils, helix braces, and plasma conduits — craft reactors in Build."
          priceOptions={[
            { currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(42), originalUnitPrice: 42 },
            { currency: 'KREX', unitPrice: 36 },
          ]}
          quantitySelector={{ min: 1, max: 99 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) =>
            props.onBuy({ itemId: 'minecore-reactor-pack-starter', currency, quantity })
          }
        />
      ),
    },
    {
      id: 'minecore-reactor-pack-advanced',
      title: 'Reactor craft pack (advanced)',
      category: 'Bundle',
      description: 'Higher-tier feedstock for Nexus reactors and the Stellar Forge line.',
      baseKasPrice: 88,
      type: 'item' as const,
      render: () => (
        <GameItemCard
          key="minecore-reactor-pack-advanced"
          title="Reactor craft pack (advanced)"
          category="Bundle"
          imageSrc="https://static.wixstatic.com/media/de4185_ebe4ca7ed61a450ca4c0f547b5c567c3~mv2.jpg"
          description="Lattice wire, shards, null fragments, flux coils, quantum attuners, and voidglass."
          priceOptions={[
            { currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(88), originalUnitPrice: 88 },
            { currency: 'KREX', unitPrice: 74 },
          ]}
          quantitySelector={{ min: 1, max: 99 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) =>
            props.onBuy({ itemId: 'minecore-reactor-pack-advanced', currency, quantity })
          }
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
      description: 'Refills battery charge on plant 1 (each quantity fills another battery slot).',
      baseKasPrice: MINECORE_PLANT_RECHARGE_COST_KAS,
      type: 'item' as const,
      render: () => (
        <GameItemCard
          key="power-topup"
          title="Plant recharge"
          category="Utility"
          imageSrc="https://static.wixstatic.com/media/de4185_1584ecece1e5489dbf13f7d111c44d99~mv2.jpg"
          description="Battery refill packs for your first plant: quantity picks how many slots get topped up."
          effects={[
            { label: 'Each pack', value: `One slot refill (${MINECORE_PLANT_RECHARGE_COST_KAS} KAS)` },
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
    <div className="space-y-6">
      <MinecoreOwnedIngredientsPanel ingredients={props.ingredients} />
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
    </div>
  );
}

