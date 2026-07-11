'use client';

import { useMemo } from 'react';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import {
  CROWDKAS_FREE_MODULE_IDS,
  CROWDKAS_FREE_MODULE_OFFERS,
  type CrowdKasFreeModuleId,
  type CrowdKasModulesConfig,
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
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';

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
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const moduleNftFlags = useMemo(() => getDonationModuleNftFlags(nftStatus), [nftStatus]);

  const setFree = (id: CrowdKasFreeModuleId, enabled: boolean) => {
    onChange({ ...modules, [id]: enabled });
  };

  const togglePendingPaid = (id: DonationPaidModuleId) => {
    const current = modules.pendingPaidModules ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    onChange({ ...modules, pendingPaidModules: next.length ? next : undefined });
  };

  return (
    <div className={className}>
      <div className="space-y-2 mb-6">
        <DAppSectionHeader title="Premium modules" className="mb-0" />
        <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          Optional campaign modules
        </h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Toggle modules for your campaign page. Free modules apply at create; paid modules unlock with a Kaspa L1 payment after your campaign is live.
        </p>
      </div>

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
    </div>
  );
}
