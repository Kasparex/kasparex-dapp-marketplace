'use client';

import { useCallback, useState } from 'react';
import { useConnectModal, useChainModal } from '@rainbow-me/rainbowkit';
import type { HubGateReason } from '@/lib/hub/access';
import type { HubNetworkBadgeConfig } from '@/lib/hub/access';

export interface HubWalletGateModalState {
  title: string;
  name: string;
  message: string;
  networkBadge: HubNetworkBadgeConfig;
  showL1Connect: boolean;
  showEvmConnect: boolean;
}

function usesHubGateModal(reason: HubGateReason): boolean {
  return (
    reason === 'l1_wallet_required' ||
    reason === 'either_wallet_required'
  );
}

export function useHubWalletGate() {
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const [l1Modal, setL1Modal] = useState<HubWalletGateModalState | null>(null);

  const closeL1Modal = useCallback(() => setL1Modal(null), []);

  const promptHubGate = useCallback(
    (
      access: { gateReason: HubGateReason; isOpenable: boolean },
      modal: Omit<HubWalletGateModalState, 'showL1Connect' | 'showEvmConnect'>
    ) => {
      if (access.isOpenable) return;

      const reason = access.gateReason;
      if (reason === 'l2_wallet_required') {
        openConnectModal?.();
        return;
      }
      if (reason === 'l2_chain_mismatch') {
        openChainModal?.();
        return;
      }
      if (usesHubGateModal(reason)) {
        setL1Modal({
          ...modal,
          showL1Connect: reason === 'l1_wallet_required' || reason === 'either_wallet_required',
          showEvmConnect: reason === 'either_wallet_required',
        });
      }
    },
    [openChainModal, openConnectModal]
  );

  return {
    l1Modal,
    closeL1Modal,
    promptHubGate,
    openEvmConnect: openConnectModal,
  };
}
