'use client';

import { useCallback, useState } from 'react';
import { useConnectModal, useChainModal } from '@rainbow-me/rainbowkit';
import type { DApp } from '@/lib/dapps';
import type { DAppGateReason } from '@/lib/dapps/access';
import type { UseDAppAccessResult } from '@/hooks/useDAppAccess';

export interface DAppWalletGateModalState {
  dapp: DApp;
  selectedNetwork?: 'all' | 'L1' | 'L2';
  isContractMissingOnNetwork?: boolean;
}

function usesL1GateModal(reason: DAppGateReason): boolean {
  return (
    reason === 'l1_wallet_required' ||
    reason === 'filter_mismatch' ||
    reason === 'contract_missing'
  );
}

export function useDAppWalletGate() {
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const [l1Modal, setL1Modal] = useState<DAppWalletGateModalState | null>(null);

  const closeL1Modal = useCallback(() => setL1Modal(null), []);

  const promptGate = useCallback(
    (
      dapp: DApp,
      access: Pick<UseDAppAccessResult, 'gateReason' | 'isOpenable'>,
      options?: Omit<DAppWalletGateModalState, 'dapp'>
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
      if (usesL1GateModal(reason)) {
        setL1Modal({ dapp, ...options });
      }
    },
    [openChainModal, openConnectModal]
  );

  return {
    l1Modal,
    closeL1Modal,
    promptGate,
    usesL1GateModal,
  };
}
