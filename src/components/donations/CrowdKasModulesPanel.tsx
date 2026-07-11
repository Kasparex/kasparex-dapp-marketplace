'use client';

import { useMemo } from 'react';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import {
  CROWDKAS_FREE_MODULE_IDS,
  CROWDKAS_FREE_MODULE_OFFERS,
  CROWDKAS_L1_PAYOUT_SPLIT_OFFER,
  CROWDKAS_PAYOUT_SPLIT_EXTRA_FEE_KAS,
  CROWDKAS_PAYOUT_SPLIT_INCLUDED_RECIPIENTS,
  computeCrowdKasPayoutSplitAddonKas,
  defaultCrowdKasPayoutSplitRows,
  type CrowdKasFreeModuleId,
  type CrowdKasModulesConfig,
  type CrowdKasPayoutSplitRow,
} from '@/lib/donations/crowdkasModules';
import {
  DONATION_MODULE_OFFERS,
  getDonationModuleNftFlags,
  getDonationModulePriceKas,
  type DonationPaidModuleId,
} from '@/lib/donations/modules';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { CROWDKAS_FREE_MODULE_CARD_CLASS, CROWDKAS_PREMIUM_MODULE_CARD_CLASS } from '@/components/donations/crowdkasFormTheme';
import { covenantPremiumAddButtonLabel } from '@/lib/covenant/kpxCovenantPricing';
import { CrowdKasPremiumSectionFields } from '@/components/donations/CrowdKasPremiumSectionFields';
import { CROWDKAS_PREMIUM_SECTION_OFFER } from '@/lib/donations/premiumSection';

export function CrowdKasModulesPanel({
  modules,
  onChange,
  paidModulesUnlocked,
  showL1PayoutSplit = false,
  className = '',
}: {
  modules: CrowdKasModulesConfig;
  onChange: (next: CrowdKasModulesConfig) => void;
  paidModulesUnlocked?: Partial<Record<DonationPaidModuleId, boolean>>;
  showL1PayoutSplit?: boolean;
  className?: string;
}) {
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const moduleNftFlags = useMemo(() => getDonationModuleNftFlags(nftStatus), [nftStatus]);

  const payoutRows = modules.payoutSplitRecipients ?? defaultCrowdKasPayoutSplitRows();
  const payoutAddonKas = computeCrowdKasPayoutSplitAddonKas(
    modules.payoutSplitEnabled ? payoutRows.length : 0,
  );

  const setFree = (id: CrowdKasFreeModuleId, enabled: boolean) => {
    onChange({ ...modules, [id]: enabled });
  };

  const togglePendingPaid = (id: DonationPaidModuleId) => {
    const current = modules.pendingPaidModules ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    onChange({ ...modules, pendingPaidModules: next.length ? next : undefined });
  };

  const updatePayoutRows = (rows: CrowdKasPayoutSplitRow[]) => {
    onChange({ ...modules, payoutSplitRecipients: rows });
  };

  const setPayoutRow = (index: number, patch: Partial<CrowdKasPayoutSplitRow>) => {
    const rows = [...payoutRows];
    rows[index] = { ...rows[index], ...patch };
    updatePayoutRows(rows);
  };

  const addPayoutRecipient = () => {
    if (payoutRows.length >= 8) return;
    updatePayoutRows([...payoutRows, { address: '', sharePercent: 0 }]);
  };

  const removePayoutRecipient = (index: number) => {
    if (payoutRows.length <= 2) return;
    updatePayoutRows(payoutRows.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <div className="space-y-2 mb-6">
        <DAppSectionHeader title="Premium modules" className="mb-0" />
        <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          Optional campaign modules
        </h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Toggle modules for your campaign page. Free modules apply at create. Paid module fees are included in the
          calculation breakdown and unlock on Kaspa L1 after your campaign is live.
        </p>
      </div>

      <div className="space-y-4">
        {CROWDKAS_FREE_MODULE_IDS.map((id) => {
          const offer = CROWDKAS_FREE_MODULE_OFFERS[id];
          const enabled = Boolean(modules[id]);
          return (
            <div key={id} className={CROWDKAS_FREE_MODULE_CARD_CLASS}>
              <KxInFormPremiumRow
                flat
                title={offer.title}
                description={offer.description}
                priceLabel="Free"
                checked={enabled}
                onToggle={() => setFree(id, !enabled)}
                accent="hub"
              />
              {enabled && id === 'donorWall' ? (
                <div className="pt-5 border-t border-zinc-200 dark:border-zinc-700 mt-4 space-y-2">
                  <KxFormFieldLabel>Thank-you message (optional)</KxFormFieldLabel>
                  <textarea
                    className="k-input w-full min-h-[80px]"
                    value={modules.thankYouMessage ?? ''}
                    onChange={(e) => onChange({ ...modules, thankYouMessage: e.target.value })}
                    placeholder="Short note shown above the donor wall…"
                  />
                </div>
              ) : null}
            </div>
          );
        })}

        {showL1PayoutSplit ? (
          <div className={CROWDKAS_PREMIUM_MODULE_CARD_CLASS}>
            <KxInFormPremiumRow
              flat
              title={CROWDKAS_L1_PAYOUT_SPLIT_OFFER.title}
              description={CROWDKAS_L1_PAYOUT_SPLIT_OFFER.description}
              priceLabel={
                modules.payoutSplitEnabled && payoutAddonKas > 0
                  ? `+${payoutAddonKas} KAS`
                  : `${CROWDKAS_PAYOUT_SPLIT_INCLUDED_RECIPIENTS} included`
              }
              checked={Boolean(modules.payoutSplitEnabled)}
              onToggle={() =>
                onChange({
                  ...modules,
                  payoutSplitEnabled: !modules.payoutSplitEnabled,
                  payoutSplitRecipients: modules.payoutSplitRecipients ?? defaultCrowdKasPayoutSplitRows(),
                })
              }
              accent="hub"
            />
            {modules.payoutSplitEnabled ? (
              <div className="pt-5 border-t border-zinc-200 dark:border-zinc-700 mt-4 space-y-3">
                {payoutRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_7rem_auto] gap-2 items-end">
                    <div>
                      <KxFormFieldLabel>Kaspa address</KxFormFieldLabel>
                      <input
                        className="k-input w-full"
                        value={row.address}
                        onChange={(e) => setPayoutRow(index, { address: e.target.value })}
                        placeholder="kaspa:…"
                      />
                    </div>
                    <div>
                      <KxFormFieldLabel>Share %</KxFormFieldLabel>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="k-input w-full"
                        value={row.sharePercent}
                        onChange={(e) => setPayoutRow(index, { sharePercent: Number(e.target.value) })}
                      />
                    </div>
                    <button
                      type="button"
                      className="k-control-btn h-[3.375rem] disabled:opacity-40"
                      disabled={payoutRows.length <= 2}
                      onClick={() => removePayoutRecipient(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" className="k-control-btn" onClick={addPayoutRecipient} disabled={payoutRows.length >= 8}>
                  {covenantPremiumAddButtonLabel('split', payoutRows.length)}
                </button>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  First {CROWDKAS_PAYOUT_SPLIT_INCLUDED_RECIPIENTS} recipients included. Each extra recipient adds +{CROWDKAS_PAYOUT_SPLIT_EXTRA_FEE_KAS} KAS to the deploy fee.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={CROWDKAS_PREMIUM_MODULE_CARD_CLASS}>
          <KxInFormPremiumRow
            flat
            title={CROWDKAS_PREMIUM_SECTION_OFFER.title}
            description={CROWDKAS_PREMIUM_SECTION_OFFER.description}
            priceLabel="Free to enable"
            checked={Boolean(modules.premiumSectionEnabled)}
            onToggle={() =>
              onChange({
                ...modules,
                premiumSectionEnabled: !modules.premiumSectionEnabled,
              })
            }
            accent="hub"
          />
          {modules.premiumSectionEnabled ? (
            <CrowdKasPremiumSectionFields modules={modules} onChange={onChange} />
          ) : null}
        </div>

        {(Object.keys(DONATION_MODULE_OFFERS) as DonationPaidModuleId[]).map((id) => {
          const offer = DONATION_MODULE_OFFERS[id];
          const unlocked = paidModulesUnlocked?.[id];
          const kas = getDonationModulePriceKas(offer.basePriceKas, krexBalance ?? 0, tier, moduleNftFlags);
          const pending = modules.pendingPaidModules?.includes(id);
          return (
            <div key={id} className={CROWDKAS_PREMIUM_MODULE_CARD_CLASS}>
              <KxInFormPremiumRow
                flat
                title={offer.title}
                description={offer.description}
                priceLabel={unlocked ? 'Paid' : `+${kas} KAS`}
                checked={unlocked || Boolean(pending)}
                onToggle={unlocked ? undefined : () => togglePendingPaid(id)}
                disabled={unlocked}
                accent="hub"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
