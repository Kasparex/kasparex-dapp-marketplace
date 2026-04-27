'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import {
  MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
  MINECORE_PLANT_PRESETS,
  MINECORE_PLANT_RECHARGE_COST_KAS,
  MINECORE_PLANT_REPAIR_KAS,
} from '@/lib/game/minecore/config';

function CostCapsule(props: {
  label: string;
  value: string;
  tierHint?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-medium ${props.accent ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}`}
        >
          {props.label}
        </span>
        <span
          className={`shrink-0 font-mono font-semibold tabular-nums ${props.accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`}
        >
          {props.value}
        </span>
      </div>
      {props.tierHint ? (
        <p className="text-[10px] font-semibold leading-snug text-sky-800 dark:text-sky-300">{props.tierHint}</p>
      ) : null}
    </div>
  );
}

function paidLine(
  baseKas: number,
  getKasPriceAfterDiscount: (n: number) => number,
  tierLabel: string,
  discountPct: number,
): string {
  const pay = getKasPriceAfterDiscount(baseKas);
  if (discountPct <= 0) {
    return `${tierLabel}: pay ${pay.toLocaleString()} KAS (no tier discount)`;
  }
  return `${tierLabel}: pay ${pay.toLocaleString()} KAS (−${discountPct}% tier)`;
}

/** Mining tab: reference costs; list KAS + KREX tier discounted payment. */
export function MinecoreMaintenanceCostsPanel(props: {
  nextSlotCostKas: number;
  getKasPriceAfterDiscount: (baseKas: number) => number;
  krexTier: string;
  krexDiscountPct: number;
}) {
  const { getKasPriceAfterDiscount, krexTier, krexDiscountPct } = props;
  const tierShort = krexTier || 'Tier0';
  const premium = MINECORE_PLANT_PRESETS.premium;
  const advanced = MINECORE_PLANT_PRESETS.advanced;

  return (
    <GamePanelCard
      title="Maintenance & setup costs"
      hint="List prices in KAS. In-game payments use your KREX tier discount on KAS (same as the shop). Second line shows what you actually pay."
    >
      <div className="mb-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-[11px] font-semibold text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
        <span className="font-black uppercase tracking-wide text-emerald-800 dark:text-emerald-200">KREX tier</span>{' '}
        <span className="text-emerald-900 dark:text-emerald-100">
          {tierShort}
          {krexDiscountPct > 0 ? ` · −${krexDiscountPct}% on KAS` : ' · no discount on KAS'} — all paid actions below use the discounted amount.
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CostCapsule
          label="Activate plant slot"
          value={`${MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS} KAS`}
          tierHint={paidLine(MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS, getKasPriceAfterDiscount, tierShort, krexDiscountPct)}
          accent
        />
        <CostCapsule
          label="Add plant row"
          value={`${props.nextSlotCostKas.toLocaleString()} KAS`}
          tierHint={paidLine(props.nextSlotCostKas, getKasPriceAfterDiscount, tierShort, krexDiscountPct)}
          accent
        />
        <CostCapsule
          label="Recharge (+1 unit & battery)"
          value={`${MINECORE_PLANT_RECHARGE_COST_KAS} KAS`}
          tierHint={paidLine(MINECORE_PLANT_RECHARGE_COST_KAS, getKasPriceAfterDiscount, tierShort, krexDiscountPct)}
          accent
        />
        <CostCapsule
          label="Repair plant"
          value={`${MINECORE_PLANT_REPAIR_KAS} KAS`}
          tierHint={paidLine(MINECORE_PLANT_REPAIR_KAS, getKasPriceAfterDiscount, tierShort, krexDiscountPct)}
          accent
        />
        <CostCapsule
          label={`Upgrade → ${premium.label}`}
          value={`${premium.costKas} KAS`}
          tierHint={
            premium.costKas > 0
              ? paidLine(premium.costKas, getKasPriceAfterDiscount, tierShort, krexDiscountPct)
              : `${tierShort}: free`
          }
          accent={premium.costKas > 0}
        />
        <CostCapsule
          label={`Upgrade → ${advanced.label}`}
          value={`${advanced.costKas} KAS`}
          tierHint={paidLine(advanced.costKas, getKasPriceAfterDiscount, tierShort, krexDiscountPct)}
          accent={advanced.costKas > 0}
        />
        <CostCapsule label="Swap setup parts" value="Free (idle / paused)" accent={false} />
      </div>
    </GamePanelCard>
  );
}
