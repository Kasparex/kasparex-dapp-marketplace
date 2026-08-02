'use client';

import { useMemo, useState } from 'react';
import { HubPaymentPanel } from '@/components/payments/HubPaymentPanel';
import { KxCheckbox } from '@/components/ui/KxCheckbox';
import { useHubPayWithCatalog } from '@/hooks/useHubPayWithCatalog';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { formatHubPaymentAmount, type HubPaymentQuoteLine } from '@/lib/payments/hubPaymentTypes';
import { resolveCatalogPaymentOption } from '@/lib/payments/currencyCatalog';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';
import {
  PRECISION_CLICK_ENTRY_KAS,
  PRECISION_ENTRY_ADDONS,
  type PrecisionAddonId,
} from '@/lib/game/precision-click/config';
import type { PrecisionClickBoosterState } from '@/lib/game/precision-click/types';

export function PrecisionClickEntryPanel(props: {
  entryUnlocked: boolean;
  ownedAddons: PrecisionAddonId[];
  booster: PrecisionClickBoosterState | null;
  inventory: { shard_lens: number; null_filter: number };
  paying: boolean;
  error?: string | null;
  success?: string | null;
  getKasPriceAfterDiscount: (listKas: number) => number;
  onPay: (args: { addonIds: PrecisionAddonId[]; currency: 'KAS' | 'KREX' }) => Promise<boolean>;
}) {
  const { tier, balance: krexBalance } = useKREXBalance();
  const [selectedAddons, setSelectedAddons] = useState<PrecisionAddonId[]>([]);
  const [payCurrencyId, setPayCurrencyId] = useState('KAS');

  const addonsKas = selectedAddons.reduce((sum, id) => {
    const def = PRECISION_ENTRY_ADDONS.find((a) => a.id === id);
    return sum + (def?.listKas ?? 0);
  }, 0);
  const listTotalKas = PRECISION_CLICK_ENTRY_KAS + addonsKas;
  const payKas = props.getKasPriceAfterDiscount(listTotalKas);
  const discountPct = krexTierDiscountPercent(tier);

  const { catalogEntries, pricingSnapshot } = useHubPayWithCatalog({ amountKas: payKas });
  const paymentOption = resolveCatalogPaymentOption(catalogEntries, payCurrencyId);
  const fmt = (kas: number) => formatHubPaymentAmount(paymentOption, kas, { snapshot: pricingSnapshot });

  const lines = useMemo((): HubPaymentQuoteLine[] => {
    const rows: HubPaymentQuoteLine[] = [
      { label: 'Training entry', value: fmt(PRECISION_CLICK_ENTRY_KAS) },
      ...selectedAddons.map((id) => {
        const def = PRECISION_ENTRY_ADDONS.find((a) => a.id === id)!;
        return { label: def.label, value: fmt(def.listKas) };
      }),
    ];
    if (discountPct > 0 && listTotalKas !== payKas) {
      rows.push({
        label: `KREX discount (${discountPct}%)`,
        value: `-${fmt(listTotalKas - payKas)}`,
        dividerBefore: true,
      });
    }
    return rows;
    // fmt closes over paymentOption + pricingSnapshot
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddons, discountPct, listTotalKas, payKas, payCurrencyId, pricingSnapshot]);

  const toggleAddon = (id: PrecisionAddonId) => {
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const currency: 'KAS' | 'KREX' = payCurrencyId === 'KREX' ? 'KREX' : 'KAS';
  const canPayCurrency = payCurrencyId === 'KAS' || payCurrencyId === 'KREX';

  return (
    <HubPaymentPanel
      title="Calculation breakdown"
      lines={lines}
      totalDisplay={fmt(payKas)}
      totalSubtitle={
        props.entryUnlocked
          ? 'Paying again opens a fresh 24h lock and resets cleared levels so you can replay.'
          : 'Pay once to open a 24h ARIA Lock. Clear each level once per lock. Chrono Seals and Sync Operative NFTs extend time.'
      }
      catalogEntries={catalogEntries}
      selectedCurrencyId={payCurrencyId}
      onCurrencyChange={setPayCurrencyId}
      onCatalogSelect={(opt) => setPayCurrencyId(opt.id)}
      tier={tier}
      krexBalance={krexBalance}
      discountNote={
        discountPct > 0 ? `${tier}: ${discountPct}% off list KAS on entry and add-ons.` : undefined
      }
      infoText="Shop boosters and items bought in the Shop tab apply automatically when active. Select optional add-ons below before paying."
      infoAccent="emerald"
      hubPointsBaseSpendKas={payKas}
      flowPreset="hubPay"
      flowBusy={props.paying}
      flowComplete={Boolean(props.success)}
      footer={
        <div className="space-y-3">
          <div className={`${KX_SURFACE_NESTED} space-y-3 rounded-xl p-3`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Optional add-ons</p>
            {PRECISION_ENTRY_ADDONS.map((addon) => {
              const checked = selectedAddons.includes(addon.id);
              return (
                <KxCheckbox
                  key={addon.id}
                  checked={checked}
                  onChange={() => toggleAddon(addon.id)}
                  label={`${addon.label} · ${fmt(addon.listKas)}`}
                  description={addon.description}
                />
              );
            })}
          </div>

          {(props.booster || props.inventory.shard_lens > 0 || props.inventory.null_filter > 0 || props.ownedAddons.length > 0) && (
            <div className={`${KX_SURFACE_NESTED} space-y-1 rounded-xl p-3 text-xs text-zinc-600 dark:text-zinc-400`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active / owned</p>
              {props.booster ? (
                <p>
                  Shop booster ×{props.booster.mult} until{' '}
                  {new Date(props.booster.until).toLocaleString()}
                </p>
              ) : null}
              {props.inventory.shard_lens > 0 ? <p>Shard Lens charges: {props.inventory.shard_lens}</p> : null}
              {props.inventory.null_filter > 0 ? <p>Null Filter charges: {props.inventory.null_filter}</p> : null}
              {props.ownedAddons.length > 0 ? (
                <p>Entry add-ons: {props.ownedAddons.join(', ')}</p>
              ) : null}
            </div>
          )}

          <button
            type="button"
            disabled={props.paying || !canPayCurrency}
            onClick={() => void props.onPay({ addonIds: selectedAddons, currency })}
            className="k-cta-games h-11 w-full px-6 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {props.paying
              ? 'Processing…'
              : !canPayCurrency
                ? 'Select KAS or KREX'
                : props.entryUnlocked
                  ? `New lock · ${fmt(payKas)}`
                  : `Pay ${fmt(payKas)} to open lock`}
          </button>
        </div>
      }
      alerts={
        props.error || props.success ? (
          <div className="space-y-2">
            {props.error ? (
              <p className="rounded-xl border border-red-300/70 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
                {props.error}
              </p>
            ) : null}
            {props.success ? (
              <p className="rounded-xl border border-emerald-300/70 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200">
                {props.success}
              </p>
            ) : null}
          </div>
        ) : null
      }
    />
  );
}
