'use client';

import { useState } from 'react';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import {
  CROWDKAS_FREE_MODULE_IDS,
  CROWDKAS_FREE_MODULE_OFFERS,
  type CrowdKasFreeModuleId,
  type CrowdKasModulesConfig,
} from '@/lib/donations/crowdkasModules';
import { DONATION_MODULE_OFFERS, type DonationPaidModuleId } from '@/lib/donations/modules';
import { getDonationModulePriceKas } from '@/lib/donations/modules';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { CROWDKAS_FREE_MODULE_CARD_CLASS, CROWDKAS_PREMIUM_MODULE_CARD_CLASS } from '@/components/donations/crowdkasFormTheme';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';

type ModuleTab = 'free' | 'paid';

export function CrowdKasModulesPanel({
  modules,
  onChange,
  paidModulesUnlocked,
  className = '',
}: {
  modules: CrowdKasModulesConfig;
  onChange: (next: CrowdKasModulesConfig) => void;
  paidModulesUnlocked?: Partial<Record<DonationPaidModuleId, boolean>>;
  className?: string;
}) {
  const [tab, setTab] = useState<ModuleTab>('free');
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  const setFree = (id: CrowdKasFreeModuleId, enabled: boolean) => {
    onChange({ ...modules, [id]: enabled });
  };

  const togglePendingPaid = (id: DonationPaidModuleId) => {
    const current = modules.pendingPaidModules ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    onChange({ ...modules, pendingPaidModules: next.length ? next : undefined });
  };

  return (
    <div id="crowdkas-dashboard-modules" className={`scroll-mt-24 ${className}`.trim()}>
      <DAppSectionHeader title="Modules" className="mb-4" />
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-fit border border-zinc-200 dark:border-zinc-800 mb-5">
        <button
          type="button"
          onClick={() => setTab('free')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'free'
              ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Free
        </button>
        <button
          type="button"
          onClick={() => setTab('paid')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'paid'
              ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Paid
        </button>
      </div>

      {tab === 'free' ? (
        <div className="space-y-4">
          {CROWDKAS_FREE_MODULE_IDS.map((id) => {
            const offer = CROWDKAS_FREE_MODULE_OFFERS[id];
            return (
              <div key={id} className={CROWDKAS_FREE_MODULE_CARD_CLASS}>
                <KxInFormPremiumRow
                  flat
                  title={offer.title}
                  description={offer.description}
                  priceLabel="Free"
                  checked={Boolean(modules[id])}
                  onToggle={() => setFree(id, !modules[id])}
                />
              </div>
            );
          })}
          {modules.donorWall ? (
            <div className={CROWDKAS_FREE_MODULE_CARD_CLASS}>
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
      ) : (
        <div className="space-y-4">
          {(Object.keys(DONATION_MODULE_OFFERS) as DonationPaidModuleId[]).map((id) => {
            const offer = DONATION_MODULE_OFFERS[id];
            const unlocked = paidModulesUnlocked?.[id];
            const kas = getDonationModulePriceKas(offer.basePriceKas, krexBalance, tier, nftStatus);
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
                />
              </div>
            );
          })}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Paid modules are unlocked with a Kaspa L1 payment, then confirmed on Igra from the Modules page after your campaign is live.
          </p>
        </div>
      )}
    </div>
  );
}
