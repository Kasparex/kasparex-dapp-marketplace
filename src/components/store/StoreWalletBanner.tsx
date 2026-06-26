'use client';

import { useHubAccess } from '@/hooks/useHubAccess';
import { useHubWalletGate } from '@/hooks/useHubWalletGate';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
import { HubNetworkBadge } from '@/components/hub/HubNetworkBadge';
import type { HubWalletGateConfig } from '@/components/hub/HubWalletGateShell';

type StoreWalletBannerProps = {
  config: HubWalletGateConfig;
  compact?: boolean;
};

export function StoreWalletBanner({ config, compact }: StoreWalletBannerProps) {
  const access = useHubAccess(config.requirement);
  const { l1Modal, closeL1Modal, promptHubGate } = useHubWalletGate();

  if (access.isOpenable) return null;

  const openGate = () => {
    promptHubGate(access, {
      title: config.title ?? 'Wallet required',
      name: config.name,
      message: config.message ?? access.message,
      networkBadge: config.networkBadge,
    });
  };

  return (
    <>
      <div
        className={`mb-6 rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-emerald-500/10 px-4 py-4 sm:px-5 ${
          compact ? 'py-3' : ''
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {config.message ?? 'Connect your Kaspa wallet to use seller tools.'}
            </p>
            <div className="mt-2">
              <HubNetworkBadge badge={config.networkBadge} size="sm" />
            </div>
          </div>
          <button type="button" onClick={openGate} className="k-cta-primary shrink-0 px-5 py-2.5 text-sm">
            Connect wallet
          </button>
        </div>
      </div>
      {l1Modal ? <HubWalletGateModal isOpen onClose={closeL1Modal} {...l1Modal} /> : null}
    </>
  );
}
