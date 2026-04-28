'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
  MINECORE_PLANT_PRESETS,
  MINECORE_PLANT_RECHARGE_COST_KAS,
  MINECORE_PLANT_REPAIR_KAS,
} from '@/lib/game/minecore/config';

function CostCapsule(props: {
  label: string;
  tooltip: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  const inner = (
    <div className="flex flex-col gap-1 rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-medium ${props.accent ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}`}
        >
          {props.label}
        </span>
        <div className="min-w-0 shrink text-right">{props.children}</div>
      </div>
    </div>
  );
  return <Tooltip content={props.tooltip}>{inner}</Tooltip>;
}

function kasTooltip(baseKas: number, payKas: number, discountPct: number, tierShort: string): string {
  return `List ${baseKas.toLocaleString()} KAS. ${tierShort}${
    discountPct > 0
      ? ` applies ${discountPct}% off; you pay ${payKas.toLocaleString()} KAS.`
      : ` — you pay ${payKas.toLocaleString()} KAS.`
  }`;
}

function KasPriceLine(props: { baseKas: number; payKas: number; discountPct: number }) {
  if (props.discountPct <= 0) {
    return (
      <span className="font-mono text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-sm">
        {props.baseKas.toLocaleString()} KAS
      </span>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-1.5 font-mono text-xs font-semibold tabular-nums sm:text-sm">
      <span className="text-zinc-400 line-through decoration-zinc-400/80">{props.baseKas.toLocaleString()} KAS</span>
      <span className="text-zinc-500">→</span>
      <span className="text-emerald-600 dark:text-emerald-400">{props.payKas.toLocaleString()} KAS</span>
    </div>
  );
}

/** Mining tab: reference costs with list → paid KAS (KREX tier); hover row for details. */
export function MinecoreMaintenanceCostsPanel(props: {
  nextSlotCostKas: number;
  getKasPriceAfterDiscount: (baseKas: number) => number;
  krexTier: string;
  krexDiscountPct: number;
  onOpenKrexWizard?: () => void;
}) {
  const tierShort = props.krexTier || 'Tier0';
  const premium = MINECORE_PLANT_PRESETS.premium;
  const advanced = MINECORE_PLANT_PRESETS.advanced;

  const row = (label: string, baseKas: number, accent: boolean, free?: boolean) => {
    if (free) {
      return (
        <CostCapsule
          key={label}
          label={label}
          accent={accent}
          tooltip="No KAS charge when the plant is idle or paused."
        >
          <span className="font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">Free</span>
        </CostCapsule>
      );
    }
    const pay = props.getKasPriceAfterDiscount(baseKas);
    return (
      <CostCapsule key={label} label={label} accent={accent} tooltip={kasTooltip(baseKas, pay, props.krexDiscountPct, tierShort)}>
        <KasPriceLine baseKas={baseKas} payKas={pay} discountPct={props.krexDiscountPct} />
      </CostCapsule>
    );
  };

  return (
    <GamePanelCard
      title="Maintenance & setup costs"
      hint="List KAS with your tier’s paid amount when a discount applies. Hover any row for the breakdown."
    >
      <div className="grid grid-cols-2 gap-2">
        {row('Activate plant slot', MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS, true)}
        {row('Add plant row', props.nextSlotCostKas, true)}
        {row('Recharge (+1 unit & battery)', MINECORE_PLANT_RECHARGE_COST_KAS, true)}
        {row('Repair plant', MINECORE_PLANT_REPAIR_KAS, true)}
        {premium.costKas <= 0
          ? row(`Upgrade → ${premium.label}`, 0, false, true)
          : row(`Upgrade → ${premium.label}`, premium.costKas, true)}
        {row(`Upgrade → ${advanced.label}`, advanced.costKas, advanced.costKas > 0)}
        {row('Swap setup parts', 0, false, true)}
        {props.onOpenKrexWizard ? (
          <Tooltip content="Higher KREX tiers reduce list KAS on priced mining actions (slots, recharge, upgrades). Click to open the KREX purchase wizard.">
            <button
              type="button"
              onClick={props.onOpenKrexWizard}
              className="flex flex-col gap-1 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-left text-xs transition-colors hover:bg-emerald-500/10 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15"
            >
              <span className="font-medium text-zinc-700 dark:text-zinc-300">KREX tier discounts</span>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Buy KREX · lower KAS costs</span>
            </button>
          </Tooltip>
        ) : null}
      </div>
    </GamePanelCard>
  );
}
