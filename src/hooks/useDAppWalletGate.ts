'use client';

import { useCallback, useState } from 'react';
import { useConnectModal, useChainModal } from '@rainbow-me/rainbowkit';
import type { DApp } from '@/lib/dapps';
import { getDAppNetworkType } from '@/lib/dapps';
import type { DAppGateReason } from '@/lib/dapps/access';
import type { UseDAppAccessResult } from '@/hooks/useDAppAccess';

export interface DAppWalletGateModalState {
  dapp: DApp;
  selectedNetwork?: 'all' | 'L1' | 'L2';
}

function usesL1GateModal(reason: DAppGateReason, networkType: 'L1' | 'L2'): boolean {
  if (networkType === 'L2') {
    return reason === 'filter_mismatch';
  }
  return reason === 'l1_wallet_required' || reason === 'filter_mismatch';
}

function isL2ChainGateReason(reason: DAppGateReason): boolean {
  return reason === 'l2_chain_mismatch' || reason === 'contract_missing';
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
      options?: Omit<DAppWalletGateModalState, 'dapp'> & { isContractMissingOnNetwork?: boolean }
    ) => {
      const networkType = getDAppNetworkType(dapp);
      const forceBlocked = options?.isContractMissingOnNetwork === true;
      if (access.isOpenable && !forceBlocked) return;

      let reason = access.gateReason;
      if (forceBlocked && networkType === 'L2' && (reason === 'open' || reason === 'contract_missing')) {
        reason = 'l2_chain_mismatch';
      }

      if (networkType === 'L2') {
        if (reason === 'l2_wallet_required') {
          setL1Modal(null);
          openConnectModal?.();
          return;
        }
        if (isL2ChainGateReason(reason) || forceBlocked) {
          setL1Modal(null);
          openChainModal?.();
          return;
        }
        if (usesL1GateModal(reason, networkType)) {
          setL1Modal({ dapp, selectedNetwork: options?.selectedNetwork });
        }
        return;
      }

      if (reason === 'l1_wallet_required' || reason === 'filter_mismatch') {
        setL1Modal({ dapp, selectedNetwork: options?.selectedNetwork });
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
