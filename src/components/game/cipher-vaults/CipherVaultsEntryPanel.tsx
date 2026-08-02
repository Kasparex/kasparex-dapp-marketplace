'use client';

import { useMemo, useState } from 'react';
import { HubPaymentPanel } from '@/components/payments/HubPaymentPanel';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import { useHubPayWithCatalog } from '@/hooks/useHubPayWithCatalog';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { formatHubPaymentAmount, type HubPaymentQuoteLine } from '@/lib/payments/hubPaymentTypes';
import { resolveCatalogPaymentOption } from '@/lib/payments/currencyCatalog';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';
import {
  CIPHER_ENTRY_ADDONS,
  CIPHER_VAULT_PASS_TIER,
  CIPHER_VAULT_TIERS,
  type CipherAddonId,
  type CipherVaultTierId,
} from '@/lib/game/cipher-vaults-config';
import type { CipherBoosterState, CipherInventory } from '@/lib/game/cipher-vaults-types';

export function CipherVaultsEntryPanel(props: {
  selectedTierId: CipherVaultTierId;
  onSelectTier: (id: CipherVaultTierId) => void;
  runActive: boolean;
  ownedAddons: CipherAddonId[];
  booster: CipherBoosterState | null;
  inventory: CipherInventory;
  paying: boolean;
  error?: string | null;
  success?: string | null;
  bankPreview: number;
  getKasPriceAfterDiscount: (listKas: number) => number;
  onPay: (args: {
    tierId: CipherVaultTierId;
    addonIds: CipherAddonId[];
    currency: 'KAS' | 'KREX' | 'VAULT_PASS';
  }) => Promise<boolean>;
}) {
  const { tier, balance: krexBalance } = useKREXBalance();
  const [selectedAddons, setSelectedAddons] = useState<CipherAddonId[]>([]);
  const [payCurrencyId, setPayCurrencyId] = useState('KAS');
  const [useVaultPass, setUseVaultPass] = useState(false);

  const vault = CIPHER_VAULT_TIERS.find((t) => t.id === props.selectedTierId) ?? CIPHER_VAULT_TIERS[0]!;
  const addonsKas = selectedAddons.reduce((sum, id) => {
    const def = CIPHER_ENTRY_ADDONS.find((a) => a.id === id);
    return sum + (def?.listKas ?? 0);
  }, 0);
  const listTotalKas = useVaultPass && vault.id === CIPHER_VAULT_PASS_TIER ? 0 : vault.entryKAS + addonsKas;
  const payKas = props.getKasPriceAfterDiscount(listTotalKas);
  const discountPct = krexTierDiscountPercent(tier);

  const { catalogEntries, pricingSnapshot } = useHubPayWithCatalog({ amountKas: Math.max(payKas, 0.001) });
  const paymentOption = resolveCatalogPaymentOption(catalogEntries, payCurrencyId);
  const fmt = (kas: number) => formatHubPaymentAmount(paymentOption, kas, { snapshot: pricingSnapshot });

  const lines = useMemo((): HubPaymentQuoteLine[] => {
    const rows: HubPaymentQuoteLine[] = [];
    if (useVaultPass && vault.id === CIPHER_VAULT_PASS_TIER) {
      rows.push({ label: 'Vault Pass (Seal Fragment)', value: '1 pass' });
    } else {
      rows.push({ label: `${vault.label} entry`, value: fmt(vault.entryKAS) });
      for (const id of selectedAddons) {
        const def = CIPHER_ENTRY_ADDONS.find((a) => a.id === id)!;
        rows.push({ label: def.label, value: fmt(def.listKas) });
      }
      if (discountPct > 0 && listTotalKas !== payKas) {
        rows.push({
          label: `KREX discount (${discountPct}%)`,
          value: `-${fmt(listTotalKas - payKas)}`,
          dividerBefore: true,
        });
      }
    }
    rows.push({
      label: 'Clear preview',
      value: `~${props.bankPreview.toLocaleString()} fragments`,
      dividerBefore: true,
    });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedAddons,
    discountPct,
    listTotalKas,
    payKas,
    payCurrencyId,
    pricingSnapshot,
    useVaultPass,
    vault,
    props.bankPreview,
  ]);

  const toggleAddon = (id: CipherAddonId, checked: boolean) => {
    setSelectedAddons((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const currency: 'KAS' | 'KREX' | 'VAULT_PASS' = useVaultPass
    ? 'VAULT_PASS'
    : payCurrencyId === 'KREX'
      ? 'KREX'
      : 'KAS';
  const canPayCurrency = useVaultPass || payCurrencyId === 'KAS' || payCurrencyId === 'KREX';
  const passOk =
    !useVaultPass ||
    (vault.id === CIPHER_VAULT_PASS_TIER &&
      props.inventory.vault_pass > 0 &&
      selectedAddons.length === 0);

  return (
    <HubPaymentPanel
      title="Calculation breakdown"
      lines={lines}
      totalDisplay={useVaultPass ? '1 Vault Pass' : fmt(payKas)}
      totalSubtitle={
        props.runActive
          ? 'A vault covenant is already open. Finish or end it before paying again.'
          : 'Pay to open a timed Cipher Vault covenant. Clear the grid before the solve timer ends.'
      }
      catalogEntries={useVaultPass ? [] : catalogEntries}
      selectedCurrencyId={payCurrencyId}
      onCurrencyChange={setPayCurrencyId}
      onCatalogSelect={(opt) => setPayCurrencyId(opt.id)}
      tier={tier}
      krexBalance={krexBalance}
      discountNote={
        !useVaultPass && discountPct > 0
          ? `${tier}: ${discountPct}% off list KAS on entry and add-ons.`
          : undefined
      }
      infoText="Pick a vault class below, optional add-ons, then pay. Shop boosters and Cipher Wardens multiply clear payouts automatically."
      infoAccent="emerald"
      hubPointsBaseSpendKas={useVaultPass ? 0 : payKas}
      flowPreset="hubPay"
      flowBusy={props.paying}
      flowComplete={Boolean(props.success)}
      footer={
        <div className="space-y-3">
          <div className={`${KX_SURFACE_NESTED} space-y-2 rounded-xl p-3`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Vault class</p>
            <div className="space-y-1.5">
              {CIPHER_VAULT_TIERS.map((t) => {
                const active = props.selectedTierId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      props.onSelectTier(t.id);
                      if (t.id !== CIPHER_VAULT_PASS_TIER) setUseVaultPass(false);
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                      active
                        ? 'border-[color:var(--hub-accent)] bg-[color:var(--hub-accent-muted,rgba(16,185,129,0.12))]'
                        : 'border-transparent hover:border-[color:var(--hub-accent)]'
                    }`}
                  >
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{t.label}</p>
                    <p className="text-[11px] text-zinc-500">
                      {t.entryKAS} KAS · {t.moveLimit} swaps · {Math.round(t.timeLimitMs / 60000)}m
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`${KX_SURFACE_NESTED} space-y-3 rounded-xl p-3`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Optional add-ons</p>
            {CIPHER_ENTRY_ADDONS.map((addon) => {
              const checked = selectedAddons.includes(addon.id);
              return (
                <Tooltip key={addon.id} content={gameTooltipRich(addon.label, addon.description)}>
                  <div className="rounded-xl border border-transparent p-2 transition-colors hover:border-[color:var(--hub-accent)]">
                    <ToggleSwitch
                      checked={checked}
                      onChange={(next) => {
                        toggleAddon(addon.id, next);
                        if (next) setUseVaultPass(false);
                      }}
                      label={`${addon.label} · ${fmt(addon.listKas)}`}
                      description={addon.description}
                    />
                  </div>
                </Tooltip>
              );
            })}
          </div>

          {props.inventory.vault_pass > 0 ? (
            <div className={`${KX_SURFACE_NESTED} rounded-xl p-3`}>
              <ToggleSwitch
                checked={useVaultPass}
                onChange={(next) => {
                  setUseVaultPass(next);
                  if (next) {
                    props.onSelectTier(CIPHER_VAULT_PASS_TIER);
                    setSelectedAddons([]);
                  }
                }}
                label={`Use Vault Pass (${props.inventory.vault_pass} owned)`}
                description="Opens Seal Fragment only. No paid add-ons."
              />
            </div>
          ) : null}

          {(props.booster ||
            props.inventory.rune_hint > 0 ||
            props.inventory.vault_pass > 0 ||
            props.ownedAddons.length > 0) && (
            <div className={`${KX_SURFACE_NESTED} space-y-1 rounded-xl p-3 text-xs text-zinc-600 dark:text-zinc-400`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active / owned</p>
              {props.booster ? (
                <p>
                  Shop booster ×{props.booster.mult} until {new Date(props.booster.until).toLocaleString()}
                </p>
              ) : null}
              {props.inventory.rune_hint > 0 ? <p>Rune Hint charges: {props.inventory.rune_hint}</p> : null}
              {props.inventory.vault_pass > 0 ? <p>Vault Passes: {props.inventory.vault_pass}</p> : null}
              {props.ownedAddons.length > 0 ? <p>Entry add-ons: {props.ownedAddons.join(', ')}</p> : null}
            </div>
          )}

          <button
            type="button"
            disabled={props.paying || props.runActive || !canPayCurrency || !passOk}
            onClick={() =>
              void props.onPay({
                tierId: props.selectedTierId,
                addonIds: useVaultPass ? [] : selectedAddons,
                currency,
              })
            }
            className="k-cta-games h-11 w-full px-6 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {props.paying
              ? 'Processing…'
              : props.runActive
                ? 'Vault already open'
                : useVaultPass
                  ? 'Open with Vault Pass'
                  : !canPayCurrency
                    ? 'Select KAS or KREX'
                    : `Pay ${fmt(payKas)} to open vault`}
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
