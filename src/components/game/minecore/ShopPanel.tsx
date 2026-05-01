'use client';

import { useState, useEffect } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import type { GameItemCurrency } from '@/components/games/shop/GameItemCard';
import type { MinecoreIngredient, MinecoreState } from '@/lib/game/minecore';
import {
  MINECORE_PLANT_RECHARGE_COST_KAS,
  minecoreKrexFromDiscountedKas,
  MINECORE_STABILITY_PATCH_LIST_KAS,
  MINECORE_KREX_BOOST_SHOP_KAS,
  MINECORE_KAS_OVERCLOCK_SHOP_KAS,
} from '@/lib/game/minecore/config';
import { CALC_INGREDIENT_KAS, CALC_INGREDIENT_GRID } from '@/lib/game/minecore/calculator';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { MinecoreOwnedIngredientsPanel } from '@/components/game/minecore/MinecoreOwnedAssetsPanel';

const ENERGY_CELLS_SHOP_IMAGE =
  'https://static.wixstatic.com/media/de4185_932b7c7511f64810be1ee201184df698~mv2.jpg';

function shopIngredientPriceOptions(
  ingredient: MinecoreIngredient,
  getKasPriceAfterDiscount: (unitPriceKas: number) => number,
) {
  const base = CALC_INGREDIENT_KAS[ingredient];
  const discountedKas = getKasPriceAfterDiscount(base);
  const out: { currency: GameItemCurrency; unitPrice: number; originalUnitPrice?: number; disabled?: boolean }[] = [
    { currency: 'KAS', unitPrice: discountedKas, originalUnitPrice: base },
    { currency: 'KREX', unitPrice: minecoreKrexFromDiscountedKas(discountedKas) },
  ];
  const gd = CALC_INGREDIENT_GRID[ingredient];
  if (gd != null) out.push({ currency: 'GRID', unitPrice: gd });
  return out;
}

function BoostPlantTargetSelect(props: {
  plantSlots: MinecoreState['plantSlots'];
  value: number;
  onChange: (slotIndex: number) => void;
}) {
  const unlocked = props.plantSlots.map((p, i) => ({ p, i })).filter((x) => x.p.unlocked);
  if (unlocked.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-zinc-100 bg-white/60 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/30">
      <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Apply to plant
      </span>
      <select
        className="k-control-btn h-9 w-full px-3 text-xs font-semibold"
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        aria-label="Apply to plant"
      >
        {unlocked.map(({ p, i }) => (
          <option key={i} value={i}>
            Plant {i + 1} · {p.type}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ShopPanel(props: {
  ingredients: MinecoreState['ingredients'];
  plantSlots: MinecoreState['plantSlots'];
  onBuy: (args: {
    itemId: string;
    currency: GameItemCurrency;
    quantity: number;
    boostTargetSlotIndex?: number;
  }) => void | Promise<void>;
  onBuyIngredient: (args: { ingredient: MinecoreIngredient; currency: GameItemCurrency; quantity: number }) => void | Promise<void>;
  getKasPriceAfterDiscount: (unitPriceKas: number) => number;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [overclockTargetSlot, setOverclockTargetSlot] = useState(0);

  useEffect(() => {
    const unlocked = props.plantSlots.map((p, i) => ({ p, i })).filter((x) => x.p.unlocked);
    if (unlocked.length === 0) return;
    if (!unlocked.some((x) => x.i === overclockTargetSlot)) {
      setOverclockTargetSlot(unlocked[0]!.i);
    }
  }, [props.plantSlots, overclockTargetSlot]);

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
          imageSrc="https://static.wixstatic.com/media/de4185_65544be623e24c6790937e5377e40aff~mv2.jpg"
          description="Basic crystal substrate used in fabrication."
          ownedCount={props.ingredients.crystalDust}
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
          imageSrc="https://static.wixstatic.com/media/de4185_ec643cd87ced4d668e010b8087b16f88~mv2.jpg"
          description="Structural plates for rigs and modules."
          ownedCount={props.ingredients.alloyPlates}
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
          imageSrc="https://static.wixstatic.com/media/de4185_831004ef92594453bc9d67003bcc9bb8~mv2.jpg"
          description="Control mesh for machine interfaces."
          ownedCount={props.ingredients.circuitMesh}
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
          ownedCount={props.ingredients.energyCells}
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
          imageSrc="https://static.wixstatic.com/media/de4185_c297065d0cde4aa3ba33752207bc911b~mv2.jpg"
          description="Used in mid-tier machines, Flux Arrays, and Regen Coils."
          ownedCount={props.ingredients.fluxCoils}
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
          imageSrc="https://static.wixstatic.com/media/de4185_5ea218db3f294f958c79fa9fe190aab2~mv2.jpg"
          description="Required for Orbit Siphon, Void Core Cell, reactor cores, and Hash Buffer crafts."
          ownedCount={props.ingredients.latticeWire}
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
          imageSrc="https://static.wixstatic.com/media/de4185_75405246c3884d7a9c02e8244966621b~mv2.jpg"
          description="Used for Neon-tier reactors, Prismatic assemblies, and the Stellar Forge line."
          ownedCount={props.ingredients.helixStabilizers}
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
          imageSrc="https://static.wixstatic.com/media/de4185_3467e302dd0c45b686a27ab66a46ae94~mv2.jpg"
          description="Key feedstock for Arc reactors and high-density containment stacks."
          ownedCount={props.ingredients.plasmaConduits}
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
          imageSrc="https://static.wixstatic.com/media/de4185_ff7e325bd34f4a4c989a41f1ada65819~mv2.jpg"
          description="Critical for Nexus reactors, advanced bundles, and anomaly-hardened sinks."
          ownedCount={props.ingredients.quantumAttuners}
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
      description: 'Hair-thin strands tempered in null-space - they glow when the grid complains.',
      baseKasPrice: CALC_INGREDIENT_KAS.voidglassFilaments,
      type: 'ingredient' as const,
      render: () => (
        <GameItemCard
          key="voidglassFilaments"
          title="Voidglass Filaments"
          category="Ingredient"
          imageSrc="https://static.wixstatic.com/media/de4185_ff5402a614c348cb9df571d98e4d197a~mv2.jpg"
          description="Feeds Stellar Forge blueprints and other void-touched high-power crafts."
          ownedCount={props.ingredients.voidglassFilaments}
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
          imageSrc="https://static.wixstatic.com/media/de4185_797d265c76e0465ba03f08dc3a8307f6~mv2.jpg"
          description="Dense crystalline shards for orbit-class rigs and deep batteries."
          ownedCount={props.ingredients.coreShards}
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
          imageSrc="https://static.wixstatic.com/media/de4185_8d65b863efe34a5d8d69d46e3abeb6a4~mv2.jpg"
          description="Thermal transfer gel for Flux Arrays and cooling modules."
          ownedCount={props.ingredients.coolingGel}
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
          imageSrc="https://static.wixstatic.com/media/de4185_5b35036fe4a94ba3ba3a36dd2e511f01~mv2.jpg"
          description="Analog resonance chips for ARIA Sensors and fusion crafts."
          ownedCount={props.ingredients.ariaChips}
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
          imageSrc="https://static.wixstatic.com/media/de4185_120a35c13a194530b144a0fc36538315~mv2.jpg"
          description="Volatile null-state fragments for hash buffers and void tech."
          ownedCount={props.ingredients.nullFragments}
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
          imageSrc="https://static.wixstatic.com/media/de4185_917204e896754c228ed9d1426e901512~mv2.jpg"
          description="Circuit mesh, energy cells, flux coils, helix braces, and plasma conduits - craft reactors in Build."
          priceOptions={[
            { currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(42), originalUnitPrice: 42 },
            { currency: 'KREX', unitPrice: minecoreKrexFromDiscountedKas(props.getKasPriceAfterDiscount(42)) },
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
          imageSrc="https://static.wixstatic.com/media/de4185_efa4ef845e6f46a68271b8bab65e73f0~mv2.jpg"
          description="Lattice wire, shards, null fragments, flux coils, quantum attuners, and voidglass."
          priceOptions={[
            { currency: 'KAS', unitPrice: props.getKasPriceAfterDiscount(88), originalUnitPrice: 88 },
            { currency: 'KREX', unitPrice: minecoreKrexFromDiscountedKas(props.getKasPriceAfterDiscount(88)) },
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
      description: '+100 diamonds to rolling daily cap for 24h and +100 on the next cycle for one plant.',
      baseKasPrice: MINECORE_KAS_OVERCLOCK_SHOP_KAS,
      type: 'item' as const,
      render: () => (
        <GameItemCard
          key="kas-overclock"
          title="KAS Overclock"
          category="Boost"
          imageSrc="https://static.wixstatic.com/media/de4185_a21da156e5fb4f90acf87e8e7a229960~mv2.jpg"
          description="Applies to the plant you choose below: raises your 24h diamond ceiling, then bumps the very next run’s expected yield."
          effects={[
            { label: 'Daily cap', value: '+100 / 24h', color: 'sky' },
            { label: 'Next cycle', value: '+100 ♦', color: 'sky' },
          ]}
          belowEffects={
            <BoostPlantTargetSelect
              plantSlots={props.plantSlots}
              value={overclockTargetSlot}
              onChange={setOverclockTargetSlot}
            />
          }
          priceOptions={[
            {
              currency: 'KAS',
              unitPrice: props.getKasPriceAfterDiscount(MINECORE_KAS_OVERCLOCK_SHOP_KAS),
              originalUnitPrice: MINECORE_KAS_OVERCLOCK_SHOP_KAS,
            },
            {
              currency: 'KREX',
              unitPrice: minecoreKrexFromDiscountedKas(
                props.getKasPriceAfterDiscount(MINECORE_KAS_OVERCLOCK_SHOP_KAS),
              ),
            },
          ]}
          quantitySelector={{ min: 1, max: 99 }}
          buyLabel="Buy"
          onBuy={({ currency, quantity }) =>
            props.onBuy({
              itemId: 'kas-overclock',
              currency,
              quantity,
              boostTargetSlotIndex: overclockTargetSlot,
            })
          }
        />
      ),
    },
    {
      id: 'krex-boost',
      title: 'KREX Boost',
      category: 'Boost',
      description: 'Shop module charge: equip in a plant module slot for 2.5× diamond yield for 1 hour.',
      baseKasPrice: MINECORE_KREX_BOOST_SHOP_KAS,
      type: 'item' as const,
      render: () => (
        <GameItemCard
          key="krex-boost"
          title="KREX Boost"
          category="Boost"
          imageSrc="https://static.wixstatic.com/media/de4185_d97bfd713c7745b787956a13ed738af4~mv2.jpg"
          description="Each purchase adds one charge to your module inventory. Install on a premium or advanced plant (Manage modules). Timer starts when slotted."
          effects={[
            { label: 'Yield', value: '2.5× ♦', color: 'emerald' },
            { label: 'Duration', value: '1 hour', color: 'zinc' },
            { label: 'Slot', value: 'Module', color: 'zinc' },
          ]}
          priceOptions={[
            {
              currency: 'KAS',
              unitPrice: props.getKasPriceAfterDiscount(MINECORE_KREX_BOOST_SHOP_KAS),
              originalUnitPrice: MINECORE_KREX_BOOST_SHOP_KAS,
            },
            {
              currency: 'KREX',
              unitPrice: minecoreKrexFromDiscountedKas(
                props.getKasPriceAfterDiscount(MINECORE_KREX_BOOST_SHOP_KAS),
              ),
            },
          ]}
          quantitySelector={{ min: 1, max: 99 }}
          buyLabel="Buy"
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
          imageSrc="https://static.wixstatic.com/media/de4185_dba6bd95290c4ad1bf82e24f19fa4533~mv2.jpg"
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
            {
              currency: 'KREX',
              unitPrice: minecoreKrexFromDiscountedKas(
                props.getKasPriceAfterDiscount(MINECORE_PLANT_RECHARGE_COST_KAS),
              ),
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
      description: 'Field-sealed kit logged with Core Ops - burns a patch to open an early maintenance window.',
      baseKasPrice: MINECORE_STABILITY_PATCH_LIST_KAS,
      type: 'item' as const,
      render: () => (
        <GameItemCard
          key="repair"
          title="Stability Patch"
          category="Repair"
          imageSrc="https://static.wixstatic.com/media/de4185_4d903cbcbbe14481bfd5487838759999~mv2.jpg"
          description="Stock these for when wear climbs but the plant has not hard-locked yet - pair with a paid service from the maintenance panel."
          effects={[{ label: 'Use', value: 'Early service eligibility' }]}
          priceOptions={[
            {
              currency: 'KAS',
              unitPrice: props.getKasPriceAfterDiscount(MINECORE_STABILITY_PATCH_LIST_KAS),
              originalUnitPrice: MINECORE_STABILITY_PATCH_LIST_KAS,
            },
            {
              currency: 'KREX',
              unitPrice: minecoreKrexFromDiscountedKas(
                props.getKasPriceAfterDiscount(MINECORE_STABILITY_PATCH_LIST_KAS),
              ),
            },
          ]}
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

