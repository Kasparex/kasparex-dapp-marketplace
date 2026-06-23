'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { HubAccessRequirement, HubNetworkBadgeConfig } from '@/lib/hub/access';
import { getHubGateMessage, getHubGateOverlaySubtitle } from '@/lib/hub/access';
import { useHubAccess } from '@/hooks/useHubAccess';
import { useHubWalletGate } from '@/hooks/useHubWalletGate';
import { HubWalletGateModal } from './HubWalletGateModal';
import { HubNetworkBadge } from './HubNetworkBadge';
import { HubWalletGateOverlay } from './HubWalletGateOverlay';

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
  enabled: enabledProp = true,
}: {
  config: HubWalletGateConfig;
  children: ReactNode;
  mode?: 'overlay' | 'replace';
  className?: string;
  /** When false, children render without gating (e.g. already-owned content). */
  enabled?: boolean;
}) {
  const access = useHubAccess(config.requirement);
  const { l1Modal, closeL1Modal, promptHubGate } = useHubWalletGate();
  const [autoPrompted, setAutoPrompted] = useState(false);
  const enabled = enabledProp ?? true;
  const isBlocked = enabled && !access.isOpenable;
  const title = config.title ?? 'Wallet required';
  const defaultMessage = config.message ?? access.message;
  const blockedMessage =
    access.gateReason === 'l2_chain_mismatch'
      ? getHubGateMessage(access.gateReason, access.requiredChainNames)
      : defaultMessage;

  const openGate = () => {
    promptHubGate(access, {
      title,
      name: config.name,
      message: blockedMessage,
      networkBadge: config.networkBadge,
    });
  };

  useEffect(() => {
    if (!config.autoPrompt || !isBlocked || autoPrompted) return;
    setAutoPrompted(true);
    if (access.gateReason === 'l2_chain_mismatch') return;
    openGate();
  }, [config.autoPrompt, isBlocked, autoPrompted, access.gateReason]);

  useEffect(() => {
    if (l1Modal && !isBlocked) {
      closeL1Modal();
    }
  }, [l1Modal, isBlocked, closeL1Modal]);

  if (!isBlocked) {
    return <>{children}</>;
  }

  const overlay = (
    <HubWalletGateOverlay
      variant={mode === 'replace' ? 'standalone' : 'fill'}
      badge={<HubNetworkBadge badge={config.networkBadge} size="md" />}
      title={blockedMessage}
      availableNetworks={
        access.requiredChainNames.length > 0 ? access.requiredChainNames : undefined
      }
      subtitle={getHubGateOverlaySubtitle(access.gateReason)}
      onClick={openGate}
    />
  );

  return (
    <div className={`relative ${className}`}>
      {l1Modal ? (
        <HubWalletGateModal isOpen onClose={closeL1Modal} {...l1Modal} />
      ) : null}

      {mode === 'replace' ? (
        <div className="flex items-center justify-center min-h-[min(24rem,70vh)] w-full p-6 sm:p-8">
          {overlay}
        </div>
      ) : (
        <>
          <div className="pointer-events-none select-none" aria-hidden>
            {children}
          </div>
          {overlay}
        </>
      )}
    </div>
  );
}
