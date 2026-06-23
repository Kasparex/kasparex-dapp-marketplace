'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { Game } from '@/lib/games/games';
import { useHubAccess } from '@/hooks/useHubAccess';
import { useHubWalletGate } from '@/hooks/useHubWalletGate';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
import { HubNetworkBadge } from '@/components/hub/HubNetworkBadge';
import { gameL1PlayGateConfig } from '@/lib/hub/gateConfigs';

export function GamePlayWalletGate({ game, children }: { game: Game; children: ReactNode }) {
  const access = useHubAccess({ layer: 'L1' });
  const { l1Modal, closeL1Modal, promptHubGate } = useHubWalletGate();
  const [autoPrompted, setAutoPrompted] = useState(false);
  const isBlocked = !access.isOpenable;
  const gateConfig = gameL1PlayGateConfig(game);

  const openGate = () => {
    promptHubGate(access, {
      title: gateConfig.title ?? 'Wallet required',
      name: gateConfig.name,
      message: gateConfig.message ?? access.message,
      networkBadge: gateConfig.networkBadge,
    });
  };

  useEffect(() => {
    if (!isBlocked || autoPrompted) return;
    setAutoPrompted(true);
    openGate();
  }, [isBlocked, autoPrompted]);

  useEffect(() => {
    if (l1Modal && access.isOpenable) {
      closeL1Modal();
    }
  }, [access.isOpenable, l1Modal, closeL1Modal]);

  return (
    <div className="relative">
      {l1Modal ? <HubWalletGateModal isOpen onClose={closeL1Modal} {...l1Modal} /> : null}
      <div className={isBlocked ? 'pointer-events-none' : ''}>{children}</div>
      {isBlocked ? (
        <button
          type="button"
          onClick={openGate}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm px-6 text-center cursor-pointer border-0"
          aria-label="Connect wallet to play"
        >
          <HubNetworkBadge badge={gateConfig.networkBadge} size="md" />
          <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {gateConfig.message}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Click to connect</p>
        </button>
      ) : null}
    </div>
  );
}
