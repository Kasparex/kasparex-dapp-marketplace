'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import {
  MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
  MINECORE_PLANT_PRESETS,
  MINECORE_PLANT_RECHARGE_COST_KAS,
  MINECORE_PLANT_REPAIR_KAS,
} from '@/lib/game/minecore/config';

function CostCapsule(props: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
      <span
        className={`font-medium ${props.accent ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}`}
      >
        {props.label}
      </span>
      <span
        className={`font-mono font-semibold tabular-nums ${props.accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`}
      >
        {props.value}
      </span>
    </div>
  );
}

/** Mining tab: reference costs for unlocks, recharge, repairs, upgrades (capsule grid like Owned Ingredients). */
export function MinecoreMaintenanceCostsPanel(props: { nextSlotCostKas: number }) {
  const premium = MINECORE_PLANT_PRESETS.premium;
  const advanced = MINECORE_PLANT_PRESETS.advanced;

  return (
    <GamePanelCard
      title="Maintenance & setup costs"
      hint="Typical KAS spends on the Mining tab: unlocking slots, keeping plants running, repairs, and tier upgrades. Changing machine, battery, worker, or modules is free while the plant is idle or paused."
    >
      <div className="grid grid-cols-2 gap-2">
        <CostCapsule
          label="Unlock plant slot"
          value={`${MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS} KAS`}
          accent
        />
        <CostCapsule label="Add plant row" value={`${props.nextSlotCostKas.toLocaleString()} KAS`} accent />
        <CostCapsule
          label="Recharge (+1 unit & battery)"
          value={`${MINECORE_PLANT_RECHARGE_COST_KAS} KAS`}
          accent
        />
        <CostCapsule label="Repair plant" value={`${MINECORE_PLANT_REPAIR_KAS} KAS`} accent />
        <CostCapsule label={`Upgrade → ${premium.label}`} value={`${premium.costKas} KAS`} accent={premium.costKas > 0} />
        <CostCapsule
          label={`Upgrade → ${advanced.label}`}
          value={`${advanced.costKas} KAS`}
          accent={advanced.costKas > 0}
        />
        <CostCapsule label="Swap setup parts" value="Free (idle / paused)" accent={false} />
      </div>
    </GamePanelCard>
  );
}
