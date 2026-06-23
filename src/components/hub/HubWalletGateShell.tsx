'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { HubAccessRequirement, HubNetworkBadgeConfig } from '@/lib/hub/access';
import { useHubAccess } from '@/hooks/useHubAccess';
import { useHubWalletGate } from '@/hooks/useHubWalletGate';
import { HubWalletGateModal } from './HubWalletGateModal';
import { HubNetworkBadge } from './HubNetworkBadge';

export interface HubWalletGateConfig {
  title?: string;
  name: string;
  message?: string;
  requirement: HubAccessRequirement;
  networkBadge: HubNetworkBadgeConfig;
  autoPrompt?: boolean;
}

export function HubWalletGateShell({
  config,
  children,
  mode = 'overlay',
  className = '',
}: {
  config: HubWalletGateConfig;
  children: ReactNode;
  mode?: 'overlay' | 'replace';
  className?: string;
}) {
  const access = useHubAccess(config.requirement);
  const { l1Modal, closeL1Modal, promptHubGate } = useHubWalletGate();
  const [autoPrompted, setAutoPrompted] = useState(false);
  const isBlocked = !access.isOpenable;
  const title = config.title ?? 'Wallet required';
  const message = config.message ?? access.message;

  const openGate = () => {
    promptHubGate(access, {
      title,
      name: config.name,
      message,
      networkBadge: config.networkBadge,
    });
  };

  useEffect(() => {
    if (!config.autoPrompt || !isBlocked || autoPrompted) return;
    setAutoPrompted(true);
    openGate();
  }, [config.autoPrompt, isBlocked, autoPrompted]);

  if (!isBlocked) {
    return <>{children}</>;
  }

  const overlay = (
  <button
      type="button"
      onClick={openGate}
      className="flex flex-col items-center justify-center gap-3 rounded-xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm px-6 py-10 text-center cursor-pointer border border-zinc-200 dark:border-zinc-800 w-full"
      aria-label="Connect wallet to continue"
    >
      <HubNetworkBadge badge={config.networkBadge} size="md" />
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{message}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Click to connect</p>
    </button>
  );

  return (
    <div className={`relative ${className}`}>
      {l1Modal ? (
        <HubWalletGateModal isOpen onClose={closeL1Modal} {...l1Modal} />
      ) : null}

      {mode === 'replace' ? (
        overlay
      ) : (
        <>
          <div className="pointer-events-none opacity-60">{children}</div>
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4">{overlay}</div>
        </>
      )}
    </div>
  );
}
