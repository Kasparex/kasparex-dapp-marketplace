'use client';

import { useCallback } from 'react';
import type { HubWalletGateConfig } from '@/components/hub/HubWalletGateShell';
import { useHubAccess } from '@/hooks/useHubAccess';
import { useHubWalletGate } from '@/hooks/useHubWalletGate';

export function useHubListingGate(config: HubWalletGateConfig, enabled = true) {
  const access = useHubAccess(config.requirement);
  const { l1Modal, closeL1Modal, promptHubGate } = useHubWalletGate();
  const isOpenable = !enabled || access.isOpenable;

  const promptGate = useCallback(() => {
    if (!enabled || access.isOpenable) return;
    promptHubGate(access, {
      title: config.title ?? 'Wallet required',
      name: config.name,
      message: config.message ?? access.message,
      networkBadge: config.networkBadge,
    });
  }, [access, config, enabled, promptHubGate]);

  const cardProps = useCallback(
    (href: string) => ({
      href: isOpenable ? href : undefined,
      disabled: !isOpenable,
      onClick: !isOpenable ? promptGate : undefined,
    }),
    [isOpenable, promptGate]
  );

  return {
    access,
    isOpenable,
    promptGate,
    cardProps,
    l1Modal,
    closeL1Modal,
  };
}
