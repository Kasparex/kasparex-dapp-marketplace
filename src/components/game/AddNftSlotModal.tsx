'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import type { MiningSlotType } from '@/lib/game/engine/types';
import { MINECORE_NFT_CREW_ROLES_ORDER, nftCrewRoleLabel } from '@/lib/game/minecore/asset-usage';
import { KxMultiSelectDropdown, type KxMultiSelectOption } from '@/components/ui/KxMultiSelectDropdown';

export type AddNftSlotModalOption = {
  value: MiningSlotType;
  label: string;
  badge?: string;
};

export function AddNftSlotModal(props: {
  open: boolean;
  onClose: () => void;
  /** Matches Diamond Veins default title. */
  title?: string;
  description: string;
  options?: AddNftSlotModalOption[];
  priceByType: Record<MiningSlotType, number>;
  miningAllowed?: boolean;
  onPurchase: (slotTypes: MiningSlotType[]) => void | Promise<boolean>;
  /** Initial selection when the modal opens. */
  initialTypes?: MiningSlotType[];
}) {
  const {
    open,
    onClose,
    title = 'Add NFT mining slot',
    description,
    priceByType,
    miningAllowed = true,
    onPurchase,
    initialTypes = ['worker'],
  } = props;

  const [buyTypes, setBuyTypes] = useState<MiningSlotType[]>(initialTypes);

  const options: KxMultiSelectOption[] = useMemo(() => {
    if (props.options?.length) {
      return props.options.map((o) => ({ value: o.value, label: o.label, badge: o.badge }));
    }
    return MINECORE_NFT_CREW_ROLES_ORDER.map((t) => ({
      value: t,
      label: nftCrewRoleLabel(t),
      badge: `${priceByType[t]?.toLocaleString(undefined, { maximumFractionDigits: 4 }) ?? '—'} KAS`,
    }));
  }, [props.options, priceByType]);

  useEffect(() => {
    if (!open) return;
    setBuyTypes(initialTypes.length > 0 ? initialTypes : ['worker']);
    // Reset selection only when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: open edge only
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const buyTotalKas = useMemo(
    () => buyTypes.reduce((sum, t) => sum + (priceByType[t] ?? 0), 0),
    [buyTypes, priceByType],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <Icons.X className="h-5 w-5" />
          </button>
        </div>
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">
          Slot type
        </label>
        <div className="mb-2 w-full">
          <KxMultiSelectDropdown
            values={buyTypes}
            onChange={(next) =>
              setBuyTypes(
                next.filter((v): v is MiningSlotType =>
                  MINECORE_NFT_CREW_ROLES_ORDER.includes(v as MiningSlotType),
                ),
              )
            }
            options={options}
            ariaLabel="Slot types to purchase"
            placeholder="Select slot types…"
            triggerClassName="k-field-trigger h-11 w-full min-w-0"
            menuClassName="w-full min-w-[280px]"
          />
        </div>
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        <button
          type="button"
          disabled={!miningAllowed || buyTypes.length === 0}
          onClick={async () => {
            const ok = await onPurchase(buyTypes);
            if (ok) onClose();
          }}
          className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {buyTypes.length === 0
            ? 'Select at least one slot type'
            : `Pay ${buyTotalKas.toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS · ${buyTypes.length} slot${buyTypes.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}
